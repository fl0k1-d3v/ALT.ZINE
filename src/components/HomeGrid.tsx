import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, NativeModules } from 'react-native';
import { PageType } from '../types';

const { FilePickerModule } = NativeModules;

const GRID_DATA = [
  { id: '1', label: 'listB', page: 'Books List' },
  { id: '2', label: 'currB', page: 'Current Book' },
  { id: '3', label: 'upB', page: null },
  { id: '4', label: 'listN', page: 'Notes List' },
  { id: '5', label: 'newN', page: 'New Note' },
  { id: '6', label: 'lastN', page: 'Last Note' },
  { id: '7', label: 'settings', page: 'Settings Page' },
  { id: '8', label: 'credits', page: 'Created By Fl0k1' },
  { id: '9', label: 'theme', page: 'Theme Settings' },
];

interface HomeGridProps {
  onNavigate: (page: PageType) => void;
  onLastNote: () => void;
}

export const HomeGrid: React.FC<HomeGridProps> = ({ onNavigate, onLastNote }) => {
  return (
    <View style={styles.gridWrapper}>
      <View style={styles.gridContainer}>
        {GRID_DATA.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridItem}
            activeOpacity={0.7}
            onPress={() => {
              if (item.id === '6') {
                onLastNote();
              } else if (item.id === '3') {
                FilePickerModule?.pickFile();
              } else if (item.page) {
                onNavigate(item.page as PageType);
              }
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

const styles = StyleSheet.create({
  gridWrapper: { flex: 1, justifyContent: 'center', padding: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#111',
    marginBottom: '3%',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  gridId: { color: '#444', fontSize: 10, position: 'absolute', top: 5, left: 8, fontFamily: 'VT323-Regular' },
  gridLabel: { color: '#0F0', fontSize: 13, textTransform: 'uppercase', fontFamily: 'VT323-Regular' },
});
