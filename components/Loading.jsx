import { ActivityIndicator, StyleSheet, View } from 'react-native';
import React from 'react';
import { theme } from '../constants/theme';

const Loading = ({ size = 'large', color = theme.colors.primary }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1, // This ensures the loader is centered within its container
  },
});