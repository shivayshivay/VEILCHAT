import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useAuthStore } from "@/store/authStore";

export default function SplashScreen() {
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);

  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(100, withSpring(1, { damping: 10, stiffness: 80 }));

    glowOpacity.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
    glowScale.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1,
      true
    ));

    textOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    textY.value = withDelay(600, withSpring(0, { damping: 14 }));
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    dotOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

    const nav = setTimeout(() => {
      if (hasSeenOnboarding) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(auth)/onboarding");
      }
    }, 2600);

    return () => clearTimeout(nav);
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));
  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));
  const dotAnimStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));
  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.glow, glowAnimStyle]} />
          <Animated.View style={[styles.ring, logoAnimStyle]}>
            <View style={styles.dot} />
          </Animated.View>
        </View>
        <Animated.View style={[styles.textBlock, textAnimStyle]}>
          <Text style={styles.brand}>VEILCHAT</Text>
        </Animated.View>
        <Animated.Text style={[styles.tagline, taglineAnimStyle]}>
          Private. Secure. Always.
        </Animated.Text>
      </View>
      <Animated.View style={[styles.bottom, dotAnimStyle]}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.loadDot, i === 0 && styles.loadDotActive]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const CYAN = "#00F5D4";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { alignItems: "center", gap: 20 },
  logoWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: CYAN,
    opacity: 0.15,
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: CYAN + "66",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CYAN,
  },
  textBlock: { alignItems: "center" },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: 8,
    color: "#E5E7EB",
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  bottom: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  dots: { flexDirection: "row", gap: 6 },
  loadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#374151",
  },
  loadDotActive: { backgroundColor: CYAN },
});
