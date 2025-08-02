import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { theme } from '../constants/theme';

const RichTextEditor = ({
  editorRef,
  onChange
}) => {
  return (
    <View style={styles.container}>
      <RichToolbar
        actions={[
          actions.setStrikethrough,
          actions.removeFormat,
          actions.setBold,
          actions.setItalic,
          actions.insertOrderedList,
          actions.blockquote,
          actions.alignLeft,
          actions.alignCenter,
          actions.alignLeft,
          actions.code,
          actions.line,
          actions.heading1,
          actions.heading4
        ]}
        IconMap={{
          [actions.heading1]: ({tintColor})=> <Text style={{color:tintColor}}>H1</Text>,
          [actions.heading4]: ({tintColor})=> <Text style={{color:tintColor}}>H4</Text>
        }}
        style={styles.richBar}
        flatContainerStyle={styles.flatStyle}
        selectedIconTint={theme.colors.primaryDark}
        editor={editorRef}
        disabled={false}
      />
      <RichEditor
        ref={editorRef}
        containerStyle={styles.rich}
        editorStyle={styles.contentStyle}
        placeholder={"What's on your mind?"}
        placeholderColor={theme.colors.darklight}
        onChange={onChange}
      />
    </View>
  );
};

export default RichTextEditor;

const styles = StyleSheet.create({
  container: {
    minHeight: 285,
  },
  richBar: {
    backgroundColor: "#ABDCE7",
    borderTopRightRadius: theme.radius.xl,
    borderTopLeftRadius: theme.radius.xl,
    borderColor: theme.colors.dark,
    borderWidth: 1.5, // Add border to match RichEditor
    borderBottomWidth: 0, // Remove the bottom border to avoid overlap
  },
  rich: {
    minHeight: 240,
    flex: 1,
    borderWidth: 1.5,
    borderTopWidth: 0, // Remove the top border to connect with toolbar
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    borderColor: theme.colors.dark,
    padding: 10,
  },
  contentStyle: {
    color: theme.colors.textDark,
    placeholderColor: 'black',
  },
  flatStyle: {
    paddingHorizontal: 8,
    gap: 3,
  },
});
