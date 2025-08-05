import { StyleSheet, Text, View, Alert, ImageBackground, TouchableOpacity } from 'react-native';
import React, { useState, } from 'react';
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

const SignUp = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      name: !form.name ? 'Name is required' : '',
      email: !form.email ? 'Email is required' : !/^\S+@\S+\.\S+$/.test(form.email) ? 'Invalid email format' : '',
      password: !form.password ? 'Password is required' : form.password.length < 6 ? 'Password must be at least 6 characters' : ''
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            email_redirect_to: 'myapp://welcome' // For email confirmation
          }
        }
      });

      if (authError) throw authError;

      // 2. Then create the profile in your public.profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user?.id,
          email: form.email,
          full_name: form.name,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 3. Check if email confirmation is needed
      if (authData.user?.identities?.length === 0) {
        Alert.alert(
          'Check your email',
          'We sent a confirmation link to your email address'
        );
        router.replace('/login');
      } else {
        // If email confirmation is disabled in Supabase settings
        router.replace('/(main)/home');
      }

    } catch (error) {
      console.error('Full signup error:', error);
      
      let errorMessage = 'Signup failed. Please try again.';
      if (error.message.includes('User already registered')) {
        errorMessage = 'This email is already registered';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password must be at least 6 characters';
      } else if (error.message.includes('Database error')) {
        errorMessage = 'Account created but profile setup failed. Please login and update your profile.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <ScreenWrapper bg="transparent">
        <StatusBar style="light" />
        <View style={styles.container}>
          <BackButton router={router} />

          <View>
            <Text style={styles.welcomeText}>Let&#39;s Get Started</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.description}>
              Create your account to continue
            </Text>

            <Input
              icon={<Icon name="user" size={24} />}
              placeholder="Full Name"
              value={form.name}
              onChangeText={(text) => setForm({...form, name: text})}
              error={errors.name}
            />

            <Input
              icon={<Icon name="mail" size={24} />}
              placeholder="Email Address"
              value={form.email}
              onChangeText={(text) => setForm({...form, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              icon={<Icon name="lock" size={24} />}
              placeholder="Password (min 6 characters)"
              value={form.password}
              onChangeText={(text) => setForm({...form, password: text})}
              secureTextEntry
              error={errors.password}
            />

            <Button
              title={loading ? 'Creating Account...' : 'Sign Up'}
              onPress={handleSignUp}
              disabled={loading}
              style={styles.signupButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: wp(5),
    paddingTop: hp(8),
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  description: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    marginBottom: hp(3),
  },
  form: {
    gap: hp(2),
  },
  signupButton: {
    marginTop: hp(3),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: hp(4),
  },
  footerText: {
    color: theme.colors.textLight,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: wp(1),
  },
});

export default SignUp;