import { StyleSheet, Text, View, Alert, ImageBackground } from 'react-native';
import React, { useState, useRef } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
import { hp, wp } from '../helpers/common';
import Icon from '../assets/icons'; // make sure this is a working icon map
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

// ✅ Image asset (ensure this path is correct)
const backgroundImage = require('../assets/images/bg 8.jpg');

const SignUp = () => {
  const router = useRouter();
  const emailRef = useRef('');
  const nameRef = useRef('');
  const passwordRef = useRef('');
  const [loading, setLoading] = useState(false);

  const onsubmit = async () => {
    if (!emailRef.current || !passwordRef.current || !nameRef.current) {
      Alert.alert('Sign Up', 'Please fill all fields');
      return;
    }

    const name = nameRef.current.trim();
    const email = emailRef.current.trim();
    const password = passwordRef.current.trim();

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    setLoading(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert('Success', 'Check your email to confirm your account');
      router.replace('/login');
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <ScreenWrapper bg="transparent">
        <StatusBar style="light" />
        <View style={styles.container}>
          <BackButton router={router} />

          <View>
            <Text style={styles.welcomeText}>Let&apos;s</Text>
            <Text style={styles.welcomeText}>Get Started</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.description}>
              Please fill details to create a new account
            </Text>

            <Input
              style={styles.input}
              icon={<Icon name="user" size={26} strokewidth={1.6} />}
              placeholder="Enter your Name"
              placeholderTextColor="#FFFFFF"
              onChangeText={(value) => (nameRef.current = value)}
            />
            <Input
              style={styles.input}
              icon={<Icon name="mail" size={26} strokewidth={1.6} />}
              placeholder="Enter your Email"
              placeholderTextColor="#FFFFFF"
              onChangeText={(value) => (emailRef.current = value)}
            />
            <Input
              style={styles.input}
              icon={<Icon name="lock" size={26} strokewidth={1.6} />}
              placeholder="Enter your Password"
              placeholderTextColor="#FFFFFF"
              secureTextEntry
              onChangeText={(value) => (passwordRef.current = value)}
            />

            <Button title="Sign Up" loading={loading} onPress={onsubmit} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Text
              onPress={() => router.push('/login')}
              style={[styles.footerText, styles.loginText]}>
              Login
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    </ImageBackground>
  );
};

export default SignUp;

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
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  description: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  form: {
    gap: 25,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 20,
  },
  footerText: {
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
  loginText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  input: {
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
  },
});
