import { StyleSheet, Text, View, Pressable, Alert, ImageBackground } from 'react-native';
import React, { useState, useRef } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
import { hp, wp } from '../helpers/common';
import Icon from '../assets/icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

const backgroundImage = require('../assets/images/white.jpg');

const Login = () => {
  const router = useRouter();
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const [loading, setLoading] = useState(false);

  const onsubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert('Login', 'Please fill all fields');
      return;
    }

    const email = emailRef.current.trim();
    const password = passwordRef.current.trim();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      // Navigate directly to home.jsx without showing alert
      router.replace('/home'); // Changed from '/app/(main)/home.jsx' to '/home'
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <ScreenWrapper bg="transparent">
        <StatusBar style="dark" />
        <View style={styles.container}>
          <BackButton router={router} />

          <View>
            <Text style={styles.welcomeText}>Hey,</Text>
            <Text style={styles.welcomeText}>Welcome Back</Text>
          </View>

          <View style={styles.form}>
            <Text style={{ fontSize: hp(2.5), color: theme.colors.text }}>
              Please Login To Continue
            </Text>
            <Input
              style={styles.input}
              icon={<Icon name="mail" size={26} strokewidth={1.6} />}
              placeholder="Enter your Email"
              placeholderTextColor="black"
              onChangeText={(value) => { emailRef.current = value; }}
            />
            <Input
              style={styles.input}
              icon={<Icon name="lock" size={26} strokewidth={1.6} />}
              placeholder="Enter your password"
              placeholderTextColor="black"
              secureTextEntry
              onChangeText={(value) => { passwordRef.current = value; }}
            />
            <Text style={styles.forgetPassword}>Forgot Password?</Text>
            <Button title={'Login'} loading={loading} onPress={onsubmit} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account</Text>
            <Pressable onPress={() => router.push('signUp')}>
              <Text style={[styles.footerText, { color: theme.colors.primary, fontWeight: theme.fonts.semibold }]}>
                SignUp
              </Text>
            </Pressable>
          </View>
        </View>
      </ScreenWrapper>
    </ImageBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    gap: 45,
    paddingHorizontal: wp(4),
  },
  welcomeText: {
    fontSize: hp(5),
    fontWeight: theme.fonts.text,
    color: theme.colors.text,
  },
  form: {
    gap: 25,
  },
  forgetPassword: {
    textAlign: 'right',
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: hp(2.6),
  },
  input: {
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
  },
});