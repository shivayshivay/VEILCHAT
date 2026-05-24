import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

type Mode = "signin" | "signup";

export default function EmailLoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginWithEmail, isLoading, error, setError } = useAuthStore();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const indicatorX = useSharedValue(0);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 24);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    indicatorX.value = withSpring(m === "signin" ? 0 : 1, { damping: 14 });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(indicatorX.value === 0 ? 0 : 0, { duration: 200 }),
      },
    ],
  }));

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = password.length >= 6;
  const canSubmit =
    isValidEmail &&
    isValidPassword &&
    (mode === "signin" || password === confirmPassword);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    const ok = await loginWithEmail(email, password, mode === "signup");
    if (ok) {
      if (mode === "signup") {
        router.replace("/(auth)/profile-setup");
      } else {
        router.replace("/(tabs)");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#00F5D412", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.inner, { paddingTop: topPad + 16, paddingBottom: botPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#E5E7EB" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === "signin" ? "Welcome back" : "Create account"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "signin"
              ? "Sign in to your VEILCHAT account"
              : "Join the most private messenger"}
          </Text>
        </View>

        <View style={styles.tabRow}>
          {(["signin", "signup"] as Mode[]).map((m) => (
            <Pressable
              key={m}
              style={[styles.tab, mode === m && styles.tabActive]}
              onPress={() => switchMode(m)}
            >
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === "signin" ? "Sign In" : "Sign Up"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailFocused ? "#00F5D4" : "#6B7280"}
                style={styles.inputIcon}
              />
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@example.com"
                placeholderTextColor="#374151"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.textInput}
              />
              {isValidEmail && (
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputWrap, passFocused && styles.inputWrapFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passFocused ? "#00F5D4" : "#6B7280"}
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                placeholder="Min. 6 characters"
                placeholderTextColor="#374151"
                secureTextEntry={!showPassword}
                style={styles.textInput}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#6B7280"
                />
              </Pressable>
            </View>
            {password.length > 0 && password.length < 6 && (
              <Text style={styles.fieldError}>Password must be at least 6 characters</Text>
            )}
          </View>

          {mode === "signup" && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={[styles.inputWrap, confirmPassword !== "" && password !== confirmPassword && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#374151"
                  secureTextEntry={!showPassword}
                  style={styles.textInput}
                />
              </View>
              {confirmPassword !== "" && password !== confirmPassword && (
                <Text style={styles.fieldError}>Passwords don't match</Text>
              )}
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || isLoading}
          style={({ pressed }) => [
            styles.submitBtn,
            (!canSubmit || isLoading) && styles.submitBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.submitBtnText}>
            {isLoading
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
              ? "Sign In"
              : "Create Account"}
          </Text>
          {!isLoading && <Ionicons name="arrow-forward" size={18} color="#0A0A0A" />}
        </Pressable>

        {mode === "signin" && (
          <Pressable style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const CYAN = "#00F5D4";
const RED = "#EF4444";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 28, gap: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#E5E7EB" },
  header: { gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#E5E7EB" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "#6B7280" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#1F2937" },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#6B7280" },
  tabTextActive: { color: "#E5E7EB" },
  form: { gap: 16 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#9CA3AF", marginLeft: 2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1F2937",
    paddingRight: 14,
  },
  inputWrapFocused: { borderColor: CYAN },
  inputWrapError: { borderColor: RED + "80" },
  inputIcon: { paddingHorizontal: 14, paddingVertical: 14 },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#E5E7EB",
  },
  eyeBtn: { padding: 4 },
  fieldError: { fontFamily: "Inter_400Regular", fontSize: 12, color: RED, marginLeft: 2 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: RED + "15",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: RED + "30",
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: RED, flex: 1 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYAN,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#0A0A0A" },
  forgotBtn: { alignItems: "center" },
  forgotText: { fontFamily: "Inter_500Medium", fontSize: 14, color: CYAN },
});
