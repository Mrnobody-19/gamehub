import { View } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import Loading from '../components/Loading';

const Index = () => {
  const router = useRouter();


  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/welcome'); 
    }, 1500);

    return () => clearTimeout(timer);

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
