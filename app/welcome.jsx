import { Image, Pressable, StyleSheet, Text, View, ImageBackground } from "react-native";
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
    <ScreenWrapper>
      <ImageBackground
        source={require("../assets/images/white.jpg")} // Path to your background image
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <StatusBar style="dark" />
        <View style={styles.container}>
          <Image
            style={styles.welcomeImage} 
            resizeMode="contain"
          />
          <View style={{ gap: 20 }}>
            <Text style={styles.title}>Vibexa!</Text>
            <Text style={styles.punchline}>
              &quot;Where Connection Ignites&quot;
            </Text>
          </View>

          <View style={styles.footer}>
            <Button
              title="Getting Started"
              buttonStyle={{ marginHorizontal: wp(3) }}
              onPress={() => router.push("signUp")}
            />
            <View style={styles.bottomTextContainer}>
              <Text style={styles.loginText}>
                Already have an account!
              </Text>
              <Pressable onPress={() => router.push('login')}>
                <Text style={[styles.loginText, { color: theme.colors.primary, fontWeight: theme.fonts.semibold }]}>
                  Login
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ImageBackground>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  welcomeImage: {
    height: hp(30),
    width: wp(100),
    alignSelf: 'center',
  },
  title: {
    color: theme.colors.dark,
    fontSize: hp(9),
    textAlign: "center",
    fontWeight: theme.fonts.extrabold,
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 0, 255, 0.7)', // Pink neon glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10, // Glow effect radius
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(10),
    fontSize: hp(2.7),
    color: theme.colors.text,
    textShadowColor: 'rgba(255, 255, 255, 0.5)', // White glow for punchline
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5, // Glow effect radius
  },
  footer: {
    gap: 30,
    width: '100%',
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  loginText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: hp(2.6),
  },
});
