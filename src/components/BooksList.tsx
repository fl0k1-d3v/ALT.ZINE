import React from 'react';
import { StyleSheet, View, FlatList, Text } from 'react-native';
import { Book } from '../types';

interface BooksListProps {
  books: Book[];
  selectedIndex: number;
}

export const BooksList: React.FC<BooksListProps> = ({ books, selectedIndex }) => {
  return (
    <View style={styles.listContainer}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.listItem, index === selectedIndex && styles.selectedItem]}>
            <Text style={styles.listText} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.progressText}>
              {item.currentSegment >= item.totalSegments - 1
                ? 'COMPLETED'
                : `SEG ${item.currentSegment + 1} / ${item.totalSegments}`}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>NO BOOKS. PRESS 3 TO UPLOAD.</Text>}
      />
      <Text style={styles.backHint}>↑↓ NAV | ENTER: READ | BACK: HOME</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: { flex: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#111' },
  selectedItem: { backgroundColor: '#111', borderColor: '#0F0', borderBottomWidth: 1 },
  listText: { flex: 1, color: '#FFF', fontSize: 16, paddingHorizontal: 10, fontFamily: 'VT323-Regular' },
  progressText: { color: '#0F0', fontSize: 10, fontFamily: 'VT323-Regular' },
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
