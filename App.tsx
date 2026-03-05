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
} from 'react-native';

type Note = {
  id: string;
  text: string;
  updatedAt: number;
};

type PageType =
  | 'HOME'
  | 'Books List'
  | 'Current Book'
  | 'Upload Book'
  | 'Notes List'
  | 'New Note'
  | 'Last Note'
  | 'Settings Page'
  | 'Created By Fl0k1'
  | 'Theme Settings'
  | 'Edit Note';

const KEY_MAP: Record<string, PageType | null> = {
  'KEYCODE_1': 'Books List',
  'KEYCODE_2': 'Current Book',
  'KEYCODE_3': 'Upload Book',
  'KEYCODE_4': 'Notes List',
  'KEYCODE_5': 'New Note',
  'KEYCODE_6': 'Last Note',
  'KEYCODE_7': 'Settings Page',
  'KEYCODE_8': 'Created By Fl0k1',
  'KEYCODE_9': 'Theme Settings',
};

const GRID_DATA = [
  { id: '1', label: 'listB', page: 'Books List' },
  { id: '2', label: 'currB', page: 'Current Book' },
  { id: '3', label: 'upB', page: 'Upload Book' },
  { id: '4', label: 'listN', page: 'Notes List' },
  { id: '5', label: 'newN', page: 'New Note' },
  { id: '6', label: 'lastN', page: 'Last Note' },
  { id: '7', label: 'settings', page: 'Settings Page' },
  { id: '8', label: 'credits', page: 'Created By Fl0k1' },
  { id: '9', label: 'theme', page: 'Theme Settings' },
];

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<PageType | 'HOME'>('HOME');
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(0);

  const textInputRef = useRef<TextInput>(null);

  // Sync refs for the listener
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const currentNoteTextRef = useRef(currentNoteText);
  currentNoteTextRef.current = currentNoteText;
  const editingNoteIdRef = useRef(editingNoteId);
  editingNoteIdRef.current = editingNoteId;
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const selectedNoteIndexRef = useRef(selectedNoteIndex);
  selectedNoteIndexRef.current = selectedNoteIndex;

  const navigateTo = useCallback((page: PageType | 'HOME') => {
    setCurrentPage(page);
  }, []);

  const saveNoteInternal = () => {
    const text = currentNoteTextRef.current;
    const id = editingNoteIdRef.current;
    if (text.trim() !== '') {
        setNotes(prev => {
            if (id) {
                const other = prev.filter(n => n.id !== id);
                return [{ id, text, updatedAt: Date.now() }, ...other];
            } else {
                return [{ id: Date.now().toString(), text, updatedAt: Date.now() }, ...prev];
            }
        });
    }
    setCurrentNoteText('');
    setEditingNoteId(null);
  };

  const goBack = useCallback(() => {
    const activePage = currentPageRef.current;

    // Save logic if exiting editor
    if (activePage === 'New Note' || activePage === 'Edit Note') {
        saveNoteInternal();
    }

    if (activePage !== 'HOME') {
      setCurrentPage('HOME');
      return true;
    }

    // If on HOME, let the app exit
    BackHandler.exitApp();
    return true;
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteIndexRef.current > 0) {
      setSelectedNoteIndex(prev => prev - 1);
    }
  }, []);

  const handleLastNote = useCallback(() => {
    const currentNotes = notesRef.current;
    if (currentNotes.length > 0) {
      const last = currentNotes[0];
      setCurrentNoteText(last.text);
      setEditingNoteId(last.id);
      navigateTo('Edit Note');
    } else {
      navigateTo('New Note');
    }
  }, [navigateTo]);

  useEffect(() => {
    if (currentPage === 'New Note' || currentPage === 'Edit Note') {
      setTimeout(() => textInputRef.current?.focus(), 150);
    } else if (currentPage === 'Notes List') {
      setSelectedNoteIndex(0);
    }
  }, [currentPage]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = DeviceEventEmitter.addListener('onKeyDown', (keyName: string) => {
      const activePage = currentPageRef.current;

      if (keyName === 'KEYCODE_BACK') {
        goBack();
        return;
      }

      if (activePage === 'HOME') {
        if (keyName === 'KEYCODE_6') {
          handleLastNote();
          return;
        }
        if (KEY_MAP[keyName]) {
          navigateTo(KEY_MAP[keyName] as PageType);
          return;
        }
      }

      if (activePage === 'Notes List') {
        const currentNotes = notesRef.current;
        const currentIndex = selectedNoteIndexRef.current;

        if (keyName === 'KEYCODE_DPAD_DOWN') {
          if (currentIndex < currentNotes.length - 1) setSelectedNoteIndex(prev => prev + 1);
        } else if (keyName === 'KEYCODE_DPAD_UP') {
          if (currentIndex > 0) setSelectedNoteIndex(prev => prev - 1);
        } else if (keyName === 'KEYCODE_DPAD_RIGHT' || keyName === 'KEYCODE_ENTER') {
          if (currentNotes.length > 0) {
            const note = currentNotes[currentIndex];
            setCurrentNoteText(note.text);
            setEditingNoteId(note.id);
            navigateTo('Edit Note');
          }
        } else if (keyName === 'KEYCODE_DPAD_LEFT') {
          if (currentNotes.length > 0) deleteNote(currentNotes[currentIndex].id);
        }
      }
    });

    return () => subscription.remove();
  }, [navigateTo, goBack, deleteNote, handleLastNote]);

  const renderContent = () => {
    if (currentPage === 'New Note' || currentPage === 'Edit Note') {
      return (
        <View style={styles.editorContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            multiline
            placeholder="Type your note..."
            placeholderTextColor="#333"
            value={currentNoteText}
            onChangeText={setCurrentNoteText}
          />
          <Text style={styles.editorHint}>Press BACK to save and return Home</Text>
        </View>
      );
    }

    if (currentPage === 'Notes List') {
      return (
        <View style={styles.listContainer}>
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const firstLine = item.text.split('\n')[0] || "(Empty)";
              const isSelected = index === selectedNoteIndex;
              return (
                <View style={[styles.noteItem, isSelected && styles.selectedNoteItem]}>
                  <Text style={[styles.icon, isSelected && {color: '#F00'}]}>🗑</Text>
                  <View style={styles.divider} />
                  <Text style={styles.notePreview} numberOfLines={1}>{firstLine}</Text>
                  <View style={styles.divider} />
                  <Text style={[styles.icon, isSelected && {color: '#0F0'}]}>✎</Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>NO NOTES YET</Text>}
          />
          <View style={styles.footer}>
            <Text style={styles.backHint}>↑↓ NAVIGATE | → EDIT | ← DELETE | BACK: HOME</Text>
          </View>
        </View>
      );
    }

    if (currentPage !== 'HOME') {
      return (
        <View style={styles.pageContainer}>
          <Text style={styles.pageText}>{currentPage}</Text>
          <Text style={styles.backHint}>Press BACK to return Home</Text>
        </View>
      );
    }

    return (
      <View style={styles.gridWrapper}>
        <View style={styles.gridContainer}>
          {GRID_DATA.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              style={styles.gridItem}
              onPress={() => {
                if (item.id === '6') handleLastNote();
                else if (item.page) navigateTo(item.page as PageType);
              }}
            >
              <Text style={styles.gridId}>{item.id}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <Text style={styles.title}>ALT.ZINE</Text>
      </View>
      <View style={styles.main}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 50, paddingBottom: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 6 },
  main: { flex: 1 },
  gridWrapper: { flex: 1, justifyContent: 'center', padding: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  gridItem: { width: '31%', aspectRatio: 1, backgroundColor: '#111', marginBottom: '3%', borderRadius: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  gridId: { color: '#444', fontSize: 10, position: 'absolute', top: 5, left: 8, fontWeight: 'bold' },
  gridLabel: { color: '#0F0', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' },
  pageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  pageText: { color: '#FFF', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  backHint: { color: '#444', fontSize: 10, padding: 15, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' },
  editorContainer: { flex: 1, backgroundColor: '#000' },
  textInput: { flex: 1, color: '#FFF', fontSize: 18, padding: 20, textAlignVertical: 'top' },
  editorHint: { color: '#333', fontSize: 10, padding: 10, textAlign: 'center', textTransform: 'uppercase' },
  listContainer: { flex: 1 },
  noteItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#111' },
  selectedNoteItem: { backgroundColor: '#111', borderColor: '#0F0', borderBottomWidth: 1 },
  notePreview: { flex: 1, color: '#FFF', fontSize: 16, paddingHorizontal: 10 },
  icon: { color: '#222', fontSize: 18, paddingHorizontal: 15 },
  divider: { width: 1, height: 20, backgroundColor: '#222' },
  emptyText: { color: '#222', textAlign: 'center', marginTop: 100, fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  footer: { borderTopWidth: 1, borderTopColor: '#111' },
});

export default App;
