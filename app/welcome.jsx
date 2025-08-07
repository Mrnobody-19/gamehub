import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { hp, wp } from "../helpers/common";
import { StatusBar } from "expo-status-bar";
import { theme } from "../constants/theme";
import Button from "../components/Button";
import { useRouter } from "expo-router";

const Welcome = () => {
  const router = useRouter();

  return (
    <ScreenWrapper transparent>
      <View style={styles.backgroundOverlay} />
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.content}>
          {/* Gradient circles in background */}
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          
          {/* Main content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>VIBEXA</Text>
            <View style={styles.titleUnderline} />
            <Text style={styles.subtitle}>Where Connection Ignites</Text>
          </View>

          <View style={styles.footer}>
            <Button
              title="Get Started"
              buttonStyle={styles.primaryButton}
              textStyle={styles.buttonText}
              onPress={() => router.push("signUp")}
            />
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Pressable 
                onPress={() => router.push('login')}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(8),
    paddingVertical: hp(8),
    justifyContent: 'space-between',
  },
  // Background elements
  circle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.15,
  },
  circle1: {
    width: wp(120),
    height: wp(120),
    backgroundColor: theme.colors.primary,
    top: -wp(40),
    right: -wp(60),
  },
  circle2: {
    width: wp(100),
    height: wp(100),
    backgroundColor: '#6a0dad',
    bottom: -wp(30),
    left: -wp(40),
  },
  // Text content
  textContainer: {
    marginTop: hp(15),
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: hp(8.5),
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: hp(1),
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleUnderline: {

  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: hp(2.7),
    letterSpacing: 1.2,
    textAlign: 'center',
    lineHeight: hp(3.5),
    maxWidth: wp(80),
  },
  // Footer
  footer: {
    marginBottom: hp(8),
  },
  primaryButton: {
    backgroundColor: '',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: hp(2.2),
    marginBottom: hp(4),
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: hp(2.3),
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(2),
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: hp(2.1),
  },
  loginLink: {
    color: theme.colors.primary,
    fontSize: hp(2.1),
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});