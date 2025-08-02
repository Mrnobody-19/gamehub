import { View } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import Loading from '../components/Loading';

const Index = () => {
  const router = useRouter();

  // Optional: You can auto-redirect after a delay (e.g. splash screen)
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/welcome'); // or '/home' if user is already signed in
    }, 1500); // 1.5 seconds delay

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenWrapper bg="#fff">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loading />
      </View>
    </ScreenWrapper>
  );
};

export default Index;
