import React from 'react';
import { StyleSheet, View, TextInput, Text } from 'react-native';

interface NoteEditorProps {
  text: string;
  onChangeText: (text: string) => void;
  inputRef: React.RefObject<TextInput>;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ text, onChangeText, inputRef }) => {
  return (
    <View style={styles.editorContainer}>
      <TextInput
        ref={inputRef}
        style={styles.textInput}
        multiline
        value={text}
        onChangeText={onChangeText}
      />
      <Text style={styles.editorHint}>Press BACK to save</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  editorContainer: { flex: 1, backgroundColor: '#000' },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    padding: 20,
    textAlignVertical: 'top',
    fontFamily: 'VT323-Regular',
  },
  editorHint: { color: '#333', fontSize: 10, padding: 10, textAlign: 'center', fontFamily: 'VT323-Regular' },
});
