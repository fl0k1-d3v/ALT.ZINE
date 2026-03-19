import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  DeviceEventEmitter,
  Platform,
  TouchableOpacity,
  TextInput,
  FlatList,
  BackHandler,
  Keyboard,
  ScrollView,
  NativeModules,
} from 'react-native';

const { FilePickerModule } = NativeModules;

// Set default font family globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = { fontFamily: 'VT323-Regular' };
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = { fontFamily: 'VT323-Regular' };

type Note = { id: string; text: string; updatedAt: number; };
type Book = { id: string; title: string; content: string; segments: string[]; currentSegment: number; totalSegments: number; lastRead: number; };

type PageType = 'HOME' | 'Books List' | 'Current Book' | 'Upload Book' | 'Notes List' | 'New Note' | 'Last Note' | 'Settings Page' | 'Created By Fl0k1' | 'Theme Settings' | 'Edit Note' | 'Reader';

interface AppState {
  currentPage: PageType | 'HOME';
  notes: Note[];
  books: Book[];
  currentBookId: string | null;
  selectedItemIndex: number;
  editor: { id: string | null; text: string; initialText: string; };
}

const KEY_MAP: Record<string, PageType | null> = {
  'KEYCODE_1': 'Books List', 'KEYCODE_2': 'Current Book', 'KEYCODE_3': null,
  'KEYCODE_4': 'Notes List', 'KEYCODE_5': 'New Note', 'KEYCODE_6': 'Last Note',
  'KEYCODE_7': 'Settings Page', 'KEYCODE_8': 'Created By Fl0k1', 'KEYCODE_9': 'Theme Settings',
};

const GRID_DATA = [
  { id: '1', label: 'listB', page: 'Books List' }, { id: '2', label: 'currB', page: 'Current Book' }, { id: '3', label: 'upB', page: null },
  { id: '4', label: 'listN', page: 'Notes List' }, { id: '5', label: 'newN', page: 'New Note' }, { id: '6', label: 'lastN', page: 'Last Note' },
  { id: '7', label: 'settings', page: 'Settings Page' }, { id: '8', label: 'credits', page: 'Created By Fl0k1' }, { id: '9', label: 'theme', page: 'Theme Settings' },
];

export default function App() {
  const [state, setState] = useState<AppState>({
    currentPage: 'HOME',
    notes: [],
    books: [],
    currentBookId: null,
    selectedItemIndex: 0,
    editor: { id: null, text: '', initialText: '' },
  });

  const textInputRef = useRef<TextInput>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  const segmentText = (text: string): string[] => {
    const segments: string[] = [];
    const MAX_LINES = 10;
    const MAX_CHARS_PER_LINE = 40;

    // 1. First, split into words while preserving single newlines
    // We replace multiple newlines with a unique token to handle them as "blocks"
    const words = text.split(/(\s+)/);

    let currentSegment = "";
    let currentLines = 0;
    let currentLineLength = 0;

    words.forEach(word => {
      const isNewline = word.includes('\n');

      if (isNewline) {
        // Handle explicit newlines in text
        const newlineCount = (word.match(/\n/g) || []).length;
        currentLines += newlineCount;
        currentSegment += word;
        currentLineLength = 0;
      } else {
        // If word fits on current line
        if (currentLineLength + word.length <= MAX_CHARS_PER_LINE) {
          currentSegment += word;
          currentLineLength += word.length;
        } else {
          // Word wraps to a new line
          currentLines += 1;
          currentSegment += word;
          currentLineLength = word.length;
        }
      }

      // Check if we hit the line limit
      if (currentLines >= MAX_LINES) {
        // Finalize segment. We try to end on a sentence boundary if possible,
        // but for a strict 10-line rule, we just push it.
        segments.push(currentSegment.trimEnd());
        currentSegment = "";
        currentLines = 0;
        currentLineLength = 0;
      }
    });

    if (currentSegment.length > 0) {
      segments.push(currentSegment.trimEnd());
    }

    return segments;
  };

  const performSave = useCallback((currentState: AppState): AppState => {
    const { text, id, initialText } = currentState.editor;
    Keyboard.dismiss();
    textInputRef.current?.blur();
    let newNotes = currentState.notes;
    if (text.trim() !== '' && (!id || text !== initialText)) {
      const now = Date.now();
      if (id) {
        const other = currentState.notes.filter(n => n.id !== id);
        newNotes = [{ id, text, updatedAt: now }, ...other];
      } else {
        newNotes = [{ id: now.toString(), text, updatedAt: now }, ...currentState.notes];
      }
    }
    return { ...currentState, notes: newNotes, editor: { id: null, text: '', initialText: '' }, currentPage: 'HOME' };
  }, []);

  useEffect(() => {
    if (state.currentPage === 'New Note' || state.currentPage === 'Edit Note') {
      const timer = setTimeout(() => textInputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    } else {
      Keyboard.dismiss();
    }
  }, [state.currentPage]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subKey = DeviceEventEmitter.addListener('onKeyDown', (keyName: string) => {
      setState(current => {
        const { currentPage: activePage, selectedItemIndex: idx, notes: currentNotes, books: currentBooks, currentBookId: activeBookId } = current;

        if (keyName === 'KEYCODE_BACK') {
          if (activePage === 'New Note' || activePage === 'Edit Note') return performSave(current);
          if (activePage !== 'HOME') return { ...current, currentPage: 'HOME', selectedItemIndex: 0 };
          BackHandler.exitApp();
          return current;
        }

        if (activePage === 'HOME') {
          if (keyName === 'KEYCODE_3') { FilePickerModule?.pickFile(); return current; }
          if (keyName === 'KEYCODE_2') {
            const sorted = [...currentBooks].sort((a,b) => b.lastRead - a.lastRead);
            const last = sorted[0];
            if (last) return { ...current, currentBookId: last.id, currentPage: 'Reader', books: currentBooks.map(b => b.id === last.id ? {...b, lastRead: Date.now()} : b) };
          }
          if (keyName === 'KEYCODE_6') {
            if (currentNotes.length > 0) {
              const last = currentNotes[0];
              return { ...current, editor: { id: last.id, text: last.text, initialText: last.text }, currentPage: 'Edit Note' };
            }
            return { ...current, currentPage: 'New Note', editor: { id: null, text: '', initialText: '' } };
          }
          if (KEY_MAP[keyName]) {
            return { ...current, currentPage: KEY_MAP[keyName] as PageType, selectedItemIndex: 0 };
          }
        }

        if (activePage === 'Notes List') {
          if (keyName === 'KEYCODE_DPAD_DOWN' && idx < currentNotes.length - 1) return { ...current, selectedItemIndex: idx + 1 };
          if (keyName === 'KEYCODE_DPAD_UP' && idx > 0) return { ...current, selectedItemIndex: idx - 1 };
          if (keyName === 'KEYCODE_DPAD_RIGHT' || keyName === 'KEYCODE_ENTER' || keyName === 'KEYCODE_NUMPAD_ENTER') {
            if (currentNotes.length > 0) {
              const note = currentNotes[idx];
              return { ...current, editor: { id: note.id, text: note.text, initialText: note.text }, currentPage: 'Edit Note' };
            }
          }
          if (keyName === 'KEYCODE_DPAD_LEFT' && currentNotes.length > 0) {
            const newNotes = currentNotes.filter(n => n.id !== currentNotes[idx].id);
            return { ...current, notes: newNotes, selectedItemIndex: Math.max(0, Math.min(idx, newNotes.length - 1)) };
          }
        }

        if (activePage === 'Books List') {
          if (keyName === 'KEYCODE_DPAD_DOWN' && idx < currentBooks.length - 1) return { ...current, selectedItemIndex: idx + 1 };
          if (keyName === 'KEYCODE_DPAD_UP' && idx > 0) return { ...current, selectedItemIndex: idx - 1 };
          if (keyName === 'KEYCODE_ENTER' || keyName === 'KEYCODE_DPAD_RIGHT' || keyName === 'KEYCODE_NUMPAD_ENTER') {
            if (currentBooks.length > 0) {
              const bId = currentBooks[idx].id;
              return { ...current, currentBookId: bId, currentPage: 'Reader', books: currentBooks.map(b => b.id === bId ? {...b, lastRead: Date.now()} : b) };
            }
          }
        }

        if (activePage === 'Reader' && activeBookId) {
          const book = currentBooks.find(b => b.id === activeBookId);
          if (!book) return current;
          if (keyName === 'KEYCODE_DPAD_DOWN' && book.currentSegment < book.totalSegments - 1) {
            return { ...current, books: currentBooks.map(b => b.id === activeBookId ? { ...b, currentSegment: b.currentSegment + 1 } : b) };
          }
          if (keyName === 'KEYCODE_DPAD_UP' && book.currentSegment > 0) {
            return { ...current, books: currentBooks.map(b => b.id === activeBookId ? { ...b, currentSegment: b.currentSegment - 1 } : b) };
          }
        }

        return current;
      });
    });

    const subBook = DeviceEventEmitter.addListener('onBookUploaded', (params: any) => {
      setState(current => {
        const segments = segmentText(params.content);
        const newBook: Book = { id: params.id, title: params.title, content: params.content, segments, currentSegment: 0, totalSegments: segments.length, lastRead: Date.now() };
        return { ...current, books: [newBook, ...current.books], currentPage: 'Books List', selectedItemIndex: 0 };
      });
    });

    return () => { subKey.remove(); subBook.remove(); };
  }, [performSave]);

  const renderContent = () => {
    if (state.currentPage === 'New Note' || state.currentPage === 'Edit Note') {
      return (
        <View style={styles.editorContainer}>
          <TextInput ref={textInputRef} style={styles.textInput} multiline value={state.editor.text} onChangeText={(t) => setState(s => ({ ...s, editor: { ...s.editor, text: t }}))} />
          <Text style={styles.editorHint}>Press BACK to save</Text>
        </View>
      );
    }
    if (state.currentPage === 'Notes List') {
      return (
        <View style={styles.listContainer}>
          <FlatList data={state.notes} keyExtractor={item => item.id} renderItem={({ item, index }) => (
            <View style={[styles.listItem, index === state.selectedItemIndex && styles.selectedItem]}>
              <Text style={[styles.icon, index === state.selectedItemIndex && {color: '#F00'}]}>🗑</Text>
              <View style={styles.divider} /><Text style={styles.listText} numberOfLines={1}>{item.text.split('\n')[0]}</Text><View style={styles.divider} />
              <Text style={[styles.icon, index === state.selectedItemIndex && {color: '#0F0'}]}>✎</Text>
            </View>
          )} ListEmptyComponent={<Text style={styles.emptyText}>NO NOTES</Text>} />
          <Text style={styles.backHint}>↑↓ NAV | → EDIT | ← DEL | BACK: HOME</Text>
        </View>
      );
    }
    if (state.currentPage === 'Books List') {
      return (
        <View style={styles.listContainer}>
          <FlatList data={state.books} keyExtractor={item => item.id} renderItem={({ item, index }) => (
            <View style={[styles.listItem, index === state.selectedItemIndex && styles.selectedItem]}>
              <Text style={styles.listText} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.progressText}>{item.currentSegment >= item.totalSegments - 1 ? 'COMPLETED' : `SEG ${item.currentSegment + 1} / ${state.books[index].totalSegments}`}</Text>
            </View>
          )} ListEmptyComponent={<Text style={styles.emptyText}>NO BOOKS. PRESS 3 TO UPLOAD.</Text>} />
          <Text style={styles.backHint}>↑↓ NAV | ENTER: READ | BACK: HOME</Text>
        </View>
      );
    }
    if (state.currentPage === 'Reader' && state.currentBookId) {
      const book = state.books.find(b => b.id === state.currentBookId);
      if (!book) return null;
      return (
        <View style={styles.readerContainer}>
          <View style={styles.segmentWrapper}>
            <Text style={styles.segmentText}>{book.segments[book.currentSegment]}</Text>
          </View>
          <View style={styles.readerFooter}>
            <Text style={styles.readerProgress}>{book.currentSegment + 1} / {book.totalSegments}</Text>
          </View>
        </View>
      );
    }
    if (state.currentPage !== 'HOME') return <View style={styles.pageContainer}><Text style={state.currentPage === 'Created By Fl0k1' ? styles.creditsText : styles.pageText}>{state.currentPage}</Text><Text style={styles.backHint}>Press BACK to return Home</Text></View>;
    return (
      <View style={styles.gridWrapper}><View style={styles.gridContainer}>
        {GRID_DATA.map((item) => (
          <TouchableOpacity key={item.id} style={styles.gridItem} activeOpacity={0.7} onPress={() => {
            if (item.id === '6') setState(s => {
              const last = s.notes[0];
              return last ? { ...s, editor: { id: last.id, text: last.text, initialText: last.text }, currentPage: 'Edit Note' } : { ...s, currentPage: 'New Note' };
            });
            else if (item.id === '3') FilePickerModule?.pickFile();
            else if (item.page) setState(s => ({ ...s, currentPage: item.page as PageType, selectedItemIndex: 0 }));
          }}>
            <Text style={styles.gridId}>{item.id}</Text><Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View></View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}><Text style={styles.title}>ALT.ZINE</Text></View>
      <View style={styles.main}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 50, paddingBottom: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { color: '#FFF', fontSize: 28, letterSpacing: 6 },
  main: { flex: 1 },
  gridWrapper: { flex: 1, justifyContent: 'center', padding: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '31%', aspectRatio: 1, backgroundColor: '#111', marginBottom: '3%', borderRadius: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  gridId: { color: '#444', fontSize: 10, position: 'absolute', top: 5, left: 8 },
  gridLabel: { color: '#0F0', fontSize: 13, textTransform: 'uppercase' },
  pageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  pageText: { color: '#FFF', fontSize: 32 },
  creditsText: { color: '#0F0', fontSize: 24, letterSpacing: 2 },
  backHint: { color: '#444', fontSize: 10, padding: 15, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' },
  editorContainer: { flex: 1, backgroundColor: '#000' },
  textInput: { flex: 1, color: '#FFF', fontSize: 18, padding: 20, textAlignVertical: 'top' },
  editorHint: { color: '#333', fontSize: 10, padding: 10, textAlign: 'center' },
  listContainer: { flex: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#111' },
  selectedItem: { backgroundColor: '#111', borderColor: '#0F0', borderBottomWidth: 1 },
  listText: { flex: 1, color: '#FFF', fontSize: 16, paddingHorizontal: 10 },
  progressText: { color: '#0F0', fontSize: 10 },
  icon: { color: '#222', fontSize: 18, paddingHorizontal: 15 },
  divider: { width: 1, height: 20, backgroundColor: '#222' },
  emptyText: { color: '#222', textAlign: 'center', marginTop: 100, fontSize: 16 },
  readerContainer: { flex: 1, backgroundColor: '#000' },
  segmentWrapper: { flex: 1, justifyContent: 'flex-start', padding: 25, paddingTop: 40 },
  segmentText: { color: '#CCC', fontSize: 16, lineHeight: 24, textAlign: 'left' },
  readerFooter: { padding: 15, borderTopWidth: 1, borderTopColor: '#111', alignItems: 'center' },
  readerProgress: { color: '#444', fontSize: 10, letterSpacing: 2 },
});
