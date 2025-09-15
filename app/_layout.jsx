import { LogBox } from 'react-native';
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getUserData } from '../services/userServices';
import * as Updates from 'expo-updates'; // Add this import

LogBox.ignoreAllLogs([
  'Warning: TNodeChildrenRenderer',
  'Warning: MemoizedTNodeRenderer',
  'Warning: TRenderEngineProvider',
]);

const _layout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

const MainLayout = () => {
  const { setAuth, setUserData } = useAuth();
  const router = useRouter();

  // Add OTA update checking
  useEffect(() => {
    const checkForOTAUpdates = async () => {
      try {
        console.log('Checking for OTA updates...');
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          console.log('OTA update found! Downloading...');
          await Updates.fetchUpdateAsync();
          console.log('OTA update downloaded! Reloading app...');
          await Updates.reloadAsync();
        } else {
          console.log('No OTA updates available');
        }
      } catch (error) {
        console.log('Error checking for OTA updates:', error);
      }
    };

    checkForOTAUpdates();
  }, []);

  // Your existing auth effect
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session.user);
        updateUserData(session.user, session.user.email);
        router.replace('/home');
      } else {
        setAuth(null);
        router.replace('/welcome');
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const updateUserData = async (user, email) => {
    let res = await getUserData(user?.id);
    if (res.success) {
      setUserData({ ...res.data, email });
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="(main)/postDetails"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
};

export default _layout;