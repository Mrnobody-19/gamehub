import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
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
      router.replace('/home');
    }
  };

  return (
    <ScreenWrapper bg="transparent">
      <StatusBar style="light" />
      <View style={styles.backgroundOverlay} />
      <View style={styles.container}>
        <BackButton router={router} />

        <View style={styles.header}>
           <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={[styles.welcomeText, styles.accentText]}>back</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.subtitle}>Please Login To Continue</Text>
          <Input
            style={styles.input}
            icon={<Icon name="mail" size={26} color={theme.colors.primary} strokewidth={1.6} />}
            placeholder="Enter your Email"
            placeholderTextColor="#888"
            onChangeText={(value) => { emailRef.current = value; }}
          />
          <Input
            style={styles.input}
            icon={<Icon name="lock" size={26} color={theme.colors.primary} strokewidth={1.6} />}
            placeholder="Enter your password"
            placeholderTextColor="#888"
            secureTextEntry
            onChangeText={(value) => { passwordRef.current = value; }}
          />
          <Pressable onPress={() => {}}>
            <Text style={styles.forgetPassword}>Forgot Password?</Text>
          </Pressable>
          <Button 
            title={'Login'} 
            loading={loading} 
            onPress={onsubmit}
            buttonStyle={styles.loginButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Pressable 
            onPress={() => router.push('signUp')}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingVertical: hp(4),
  },
  header: {
    marginTop: hp(8),
    marginBottom: hp(4),
  },
  accentText: {
        color: theme.colors.primary
    },
  welcomeText: {
    fontSize: hp(5.5),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: hp(2.3),
    color: '#fff',
 
    marginBottom: hp(3),
    letterSpacing: 0.5,
  },
  form: {
    gap: hp(3),
    marginBottom: hp(4),
  },
  input: {
    color: '#fff',
    paddingLeft: wp(3),
    flex: 1,
    fontSize: hp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: hp(1.8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  forgetPassword: {
    textAlign: 'right',
    fontWeight: '600',
    color: theme.colors.primary,
    fontSize: hp(1.8),
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: hp(2),
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(2),
  },
  footerText: {
    fontSize: hp(2.5),
    color: '#fff',
  },
  signUpText: {
    color: theme.colors.primary,
    fontSize: hp(2.5),
    fontWeight: '700',
  },
});