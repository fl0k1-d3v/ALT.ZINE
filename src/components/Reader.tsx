import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Book } from '../types';

interface ReaderProps {
  book: Book;
}

export const Reader: React.FC<ReaderProps> = ({ book }) => {
  return (
    <View style={styles.readerContainer}>
      <View style={styles.segmentWrapper}>
        <Text style={styles.segmentText}>{book.segments[book.currentSegment]}</Text>
      </View>
      <View style={styles.readerFooter}>
        <Text style={styles.readerProgress}>
          {book.currentSegment + 1} / {book.totalSegments}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  readerContainer: { flex: 1, backgroundColor: '#000' },
  segmentWrapper: { flex: 1, justifyContent: 'flex-start', padding: 25, paddingTop: 40 },
  segmentText: { color: '#CCC', fontSize: 16, lineHeight: 24, textAlign: 'left', fontFamily: 'VT323-Regular' },
  readerFooter: { padding: 15, borderTopWidth: 1, borderTopColor: '#111', alignItems: 'center' },
  readerProgress: { color: '#444', fontSize: 10, letterSpacing: 2, fontFamily: 'VT323-Regular' },
});
