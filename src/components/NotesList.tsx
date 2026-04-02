import React from 'react';
import { StyleSheet, View, FlatList, Text } from 'react-native';
import { Note } from '../types';

interface NotesListProps {
  notes: Note[];
  selectedIndex: number;
}

export const NotesList: React.FC<NotesListProps> = ({ notes, selectedIndex }) => {
  return (
    <View style={styles.listContainer}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.listItem, index === selectedIndex && styles.selectedItem]}>
            <Text style={[styles.icon, index === selectedIndex && { color: '#F00' }]}>🗑</Text>
            <View style={styles.divider} />
            <Text style={styles.listText} numberOfLines={1}>
              {item.text.split('\n')[0]}
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.icon, index === selectedIndex && { color: '#0F0' }]}>✎</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>NO NOTES</Text>}
      />
      <Text style={styles.backHint}>↑↓ NAV | → EDIT | ← DEL | BACK: HOME</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: { flex: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#111' },
  selectedItem: { backgroundColor: '#111', borderColor: '#0F0', borderBottomWidth: 1 },
  listText: { flex: 1, color: '#FFF', fontSize: 16, paddingHorizontal: 10, fontFamily: 'VT323-Regular' },
  icon: { color: '#222', fontSize: 18, paddingHorizontal: 15, fontFamily: 'VT323-Regular' },
  divider: { width: 1, height: 20, backgroundColor: '#222' },
  emptyText: { color: '#222', textAlign: 'center', marginTop: 100, fontSize: 16, fontFamily: 'VT323-Regular' },
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
