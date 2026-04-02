import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  DeviceEventEmitter,
  Platform,
  BackHandler,
  Keyboard,
  NativeModules,
  Text,
} from 'react-native';

import { AppState, PageType, Book } from './src/types';
import { segmentText } from './src/utils/textUtils';
import { HomeGrid } from './src/components/HomeGrid';
import { NoteEditor } from './src/components/NoteEditor';
import { NotesList } from './src/components/NotesList';
import { BooksList } from './src/components/BooksList';
import { Reader } from './src/components/Reader';

const { FilePickerModule } = NativeModules;

const KEY_MAP: Record<string, PageType | null> = {
  'KEYCODE_1': 'Books List',
  'KEYCODE_2': 'Current Book',
  'KEYCODE_3': null,
  'KEYCODE_4': 'Notes List',
  'KEYCODE_5': 'New Note',
  'KEYCODE_6': 'Last Note',
  'KEYCODE_7': 'Settings Page',
  'KEYCODE_8': 'Created By Fl0k1',
  'KEYCODE_9': 'Theme Settings',
};

export default function App() {
  const [state, setState] = useState<AppState>({
    currentPage: 'HOME',
    notes: [],
    books: [],
    currentBookId: null,
    selectedItemIndex: 0,
    editor: { id: null, text: '', initialText: '' },
  });

  const textInputRef = useRef<any>(null);

  const performSave = useCallback((currentState: AppState): AppState => {
    const { text, id, initialText } = currentState.editor;
    Keyboard.dismiss();
    textInputRef.current?.blur();
    let newNotes = currentState.notes;
    if (text.trim() !== '' && (!id || text !== initialText)) {
      const now = Date.now();
      if (id) {
        const other = currentState.notes.filter((n) => n.id !== id);
        newNotes = [{ id, text, updatedAt: now }, ...other];
      } else {
        newNotes = [{ id: now.toString(), text, updatedAt: now }, ...currentState.notes];
      }
    }
    return {
      ...currentState,
      notes: newNotes,
      editor: { id: null, text: '', initialText: '' },
      currentPage: 'HOME',
    };
  }, []);

  useEffect(() => {
    // Focus text input when entering note editor
    if (state.currentPage === 'New Note' || state.currentPage === 'Edit Note') {
      const timer = setTimeout(() => textInputRef.current?.focus(), 100);
      return () => {
        clearTimeout(timer);
        textInputRef.current?.blur();
        Keyboard.dismiss();
      };
    }
  }, [state.currentPage]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subKey = DeviceEventEmitter.addListener('onKeyDown', (keyName: string) => {
      setState((current) => {
        const {
          currentPage: activePage,
          selectedItemIndex: idx,
          notes: currentNotes,
          books: currentBooks,
          currentBookId: activeBookId,
        } = current;

        if (keyName === 'KEYCODE_BACK') {
          if (activePage === 'New Note' || activePage === 'Edit Note') return performSave(current);
          if (activePage !== 'HOME') return { ...current, currentPage: 'HOME', selectedItemIndex: 0 };
          BackHandler.exitApp();
          return current;
        }

        if (activePage === 'HOME') {
          if (keyName === 'KEYCODE_3') {
            FilePickerModule?.pickFile();
            return current;
          }
          if (keyName === 'KEYCODE_2') {
            const sorted = [...currentBooks].sort((a, b) => b.lastRead - a.lastRead);
            const last = sorted[0];
            if (last)
              return {
                ...current,
                currentBookId: last.id,
                currentPage: 'Reader',
                books: currentBooks.map((b) =>
                  b.id === last.id ? { ...b, lastRead: Date.now() } : b
                ),
              };
          }
          if (keyName === 'KEYCODE_6') {
            if (currentNotes.length > 0) {
              const last = currentNotes[0];
              return {
                ...current,
                editor: { id: last.id, text: last.text, initialText: last.text },
                currentPage: 'Edit Note',
              };
            }
            return { ...current, currentPage: 'New Note', editor: { id: null, text: '', initialText: '' } };
          }
          if (KEY_MAP[keyName]) {
            return { ...current, currentPage: KEY_MAP[keyName] as PageType, selectedItemIndex: 0 };
          }
        }

        if (activePage === 'Notes List') {
          if (keyName === 'KEYCODE_DPAD_DOWN' && idx < currentNotes.length - 1)
            return { ...current, selectedItemIndex: idx + 1 };
          if (keyName === 'KEYCODE_DPAD_UP' && idx > 0) return { ...current, selectedItemIndex: idx - 1 };
          if (
            keyName === 'KEYCODE_DPAD_RIGHT' ||
            keyName === 'KEYCODE_ENTER' ||
            keyName === 'KEYCODE_NUMPAD_ENTER'
          ) {
            if (currentNotes.length > 0) {
              const note = currentNotes[idx];
              return {
                ...current,
                editor: { id: note.id, text: note.text, initialText: note.text },
                currentPage: 'Edit Note',
              };
            }
          }
          if (keyName === 'KEYCODE_DPAD_LEFT' && currentNotes.length > 0) {
            const newNotes = currentNotes.filter((n) => n.id !== currentNotes[idx].id);
            return {
              ...current,
              notes: newNotes,
              selectedItemIndex: Math.max(0, Math.min(idx, newNotes.length - 1)),
            };
          }
        }

        if (activePage === 'Books List') {
          if (keyName === 'KEYCODE_DPAD_DOWN' && idx < currentBooks.length - 1)
            return { ...current, selectedItemIndex: idx + 1 };
          if (keyName === 'KEYCODE_DPAD_UP' && idx > 0) return { ...current, selectedItemIndex: idx - 1 };
          if (
            keyName === 'KEYCODE_ENTER' ||
            keyName === 'KEYCODE_DPAD_RIGHT' ||
            keyName === 'KEYCODE_NUMPAD_ENTER'
          ) {
            if (currentBooks.length > 0) {
              const bId = currentBooks[idx].id;
              return {
                ...current,
                currentBookId: bId,
                currentPage: 'Reader',
                books: currentBooks.map((b) =>
                  b.id === bId ? { ...b, lastRead: Date.now() } : b
                ),
              };
            }
          }
        }

        if (activePage === 'Reader' && activeBookId) {
          const book = currentBooks.find((b) => b.id === activeBookId);
          if (!book) return current;
          if (keyName === 'KEYCODE_DPAD_DOWN' && book.currentSegment < book.totalSegments - 1) {
            return {
              ...current,
              books: currentBooks.map((b) =>
                b.id === activeBookId ? { ...b, currentSegment: b.currentSegment + 1 } : b
              ),
            };
          }
          if (keyName === 'KEYCODE_DPAD_UP' && book.currentSegment > 0) {
            return {
              ...current,
              books: currentBooks.map((b) =>
                b.id === activeBookId ? { ...b, currentSegment: b.currentSegment - 1 } : b
              ),
            };
          }
        }

        return current;
      });
    });

    const subBook = DeviceEventEmitter.addListener('onBookUploaded', (params: any) => {
      setState((current) => {
        const segments = segmentText(params.content);
        const newBook: Book = {
          id: params.id,
          title: params.title,
          content: params.content,
          segments,
          currentSegment: 0,
          totalSegments: segments.length,
          lastRead: Date.now(),
        };
        return { ...current, books: [newBook, ...current.books], currentPage: 'Books List', selectedItemIndex: 0 };
      });
    });

    return () => {
      subKey.remove();
      subBook.remove();
    };
  }, [performSave]);

  const renderContent = () => {
    if (state.currentPage === 'New Note' || state.currentPage === 'Edit Note') {
      return (
        <NoteEditor
          text={state.editor.text}
          onChangeText={(t) => setState((s) => ({ ...s, editor: { ...s.editor, text: t } }))}
          inputRef={textInputRef}
        />
      );
    }
    if (state.currentPage === 'Notes List') {
      return <NotesList notes={state.notes} selectedIndex={state.selectedItemIndex} />;
    }
    if (state.currentPage === 'Books List') {
      return <BooksList books={state.books} selectedIndex={state.selectedItemIndex} />;
    }
    if (state.currentPage === 'Reader' && state.currentBookId) {
      const book = state.books.find((b) => b.id === state.currentBookId);
      if (!book) return null;
      return <Reader book={book} />;
    }
    if (state.currentPage !== 'HOME') {
      return (
        <View style={styles.pageContainer}>
          <Text style={state.currentPage === 'Created By Fl0k1' ? styles.creditsText : styles.pageText}>
            {state.currentPage}
          </Text>
          <Text style={styles.backHint}>Press BACK to return Home</Text>
        </View>
      );
    }
    return (
      <HomeGrid
        onNavigate={(page) => setState((s) => ({ ...s, currentPage: page, selectedItemIndex: 0 }))}
        onLastNote={() =>
          setState((s) => {
            const last = s.notes[0];
            return last
              ? {
                  ...s,
                  editor: { id: last.id, text: last.text, initialText: last.text },
                  currentPage: 'Edit Note',
                }
              : { ...s, currentPage: 'New Note' };
          })
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <Text style={styles.title}>ALT.ZINE</Text>
      </View>
      <View style={styles.main}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: { color: '#FFF', fontSize: 28, fontFamily: 'VT323-Regular', letterSpacing: 6 },
  main: { flex: 1 },
  pageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  pageText: { color: '#FFF', fontSize: 32, fontFamily: 'VT323-Regular' },
  creditsText: { color: '#0F0', fontSize: 24, letterSpacing: 2, fontFamily: 'VT323-Regular' },
  backHint: {
    color: '#444',
    fontSize: 10,
    padding: 15,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'VT323-Regular',
  },
});
