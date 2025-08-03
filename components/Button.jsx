import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import Loading from './Loading';

const Button = ({
  buttonStyle,
  textStyle,
  title = '',
  onPress = () => {}, // ✅ comma added here
  loading = false,
  hasShadow = true,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const shadowStyle = {
    shadowColor: theme.colors.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  };

  const pressedStyle = isPressed
    ? {
        shadowColor: '#F77737',
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 12,
      }
    : {};

  if (loading) {
    return (
      <View style={[styles.button, buttonStyle, { backgroundColor: 'white' }]}>
        <Loading />
      </View>
    );
  }

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      style={[
        styles.button,
        buttonStyle,
        hasShadow && shadowStyle,
        pressedStyle,
      ]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F77737',
    height: hp(6.6),
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#F77737',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    // Note: backdropFilter doesn't work in React Native, so this line can be removed or ignored
    // backdropFilter: 'blur(10px)',
  },
  text: {
    fontSize: hp(2.5),
    color: 'white',
    fontWeight: theme.fonts.bold,
  },
});
