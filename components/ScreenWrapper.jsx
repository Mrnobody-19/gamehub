import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ScreenWrapper = ({ 
  children, 
  bg = '#ffffff', 
  style, 
  statusBarStyle = 'dark' 
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      { 
        flex: 1,
        backgroundColor: bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      },
      style
    ]}>
      {children}
    </View>
  );
};

export default ScreenWrapper;