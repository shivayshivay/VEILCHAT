import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const isWeb = Platform.OS === "web";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (isWeb ? 67 : 0);
  const botPad = Math.max(insets.bottom, isWeb ? 34 : 24);

  // On web, start at final values so content is immediately visible
  const logoOpacity = useSharedValue(isWeb ? 1 : 0);
  const logoY = useSharedValue(isWeb ? 0 : -20);
  const card1Opacity = useSharedValue(isWeb ? 1 : 0);
  const card1Y = useSharedValue(isWeb ? 0 : 30);
  const card2Opacity = useSharedValue(isWeb ? 1 : 0);
  const card2Y = useSharedValue(isWeb ? 0 : 30);

  React.useEffect(() => {
    if (isWeb) return; // Already at final values on web
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    logoY.value = withDelay(100, withSpring(0, { damping: 14 }));
    card1Opacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    card1Y.value = withDelay(300, withSpring(0, { damping: 14 }));
    card2Opacity.value = withDelay(450, withTiming(1, { duration: 400 }));
    card2Y.value = withDelay(450, withSpring(0, { damping: 14 }));
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));
  const card1AnimStyle = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateY: card1Y.value }],
  }));
  const card2AnimStyle = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateY: card2Y.value }],
  }));

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <LinearGradient
        colors={["#00F5D418", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
      />

      <Animated.View style={[styles.hero, logoAnimStyle]}>
        <View style={styles.logoRing}>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.brand}>VEILCHAT</Text>
        <Text style={styles.tagline}>The most secure way to connect</Text>
      </Animated.View>

      <View style={[styles.actions, { paddingBottom: botPad }]}>
        <Animated.View style={card1AnimStyle}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={() => router.push("/(auth)/phone")}
          >
            <View style={styles.btnIcon}>
              <Ionicons name="call" size={20} color="#0A0A0A" />
            </View>
            <Text style={styles.primaryBtnText}>Continue with Phone</Text>
            <Ionicons name="arrow-forward" size={18} color="#0A0A0A" />
          </Pressable>
        </Animated.View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Animated.View style={card2AnimStyle}>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={() => router.push("/(auth)/email-login")}
          >
            <View style={[styles.btnIcon, styles.btnIconOutline]}>
              <Ionicons name="mail-outline" size={20} color="#00F5D4" />
            </View>
            <Text style={styles.secondaryBtnText}>Continue with Email</Text>
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </Pressable>
        </Animated.View>

        <Text style={styles.terms}>
          By continuing, you agree to our{" "}
          <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const CYAN = "#00F5D4";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "space-between" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: CYAN + "55",
    alignItems: "center",
    justifyContent: "center",
  },
  logoDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: CYAN },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: 7,
    color: "#E5E7EB",
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  actions: { paddingHorizontal: 28, gap: 16 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CYAN,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  pressed: { opacity: 0.8 },
  btnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0A0A0A33",
    alignItems: "center",
    justifyContent: "center",
  },
  btnIconOutline: { backgroundColor: CYAN + "1A" },
  primaryBtnText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#0A0A0A",
  },
  secondaryBtnText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#E5E7EB",
  },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#1F2937" },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#6B7280" },
  terms: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#6B7280", textAlign: "center", lineHeight: 18 },
  termsLink: { color: CYAN },
});
