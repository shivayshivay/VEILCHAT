import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VeilButton } from "@/components/ui/VeilButton";
import { VeilInput } from "@/components/ui/VeilInput";
import { useAuthStore } from "@/store/authStore";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isLoading, error } = useAuthStore();
  const [phone, setPhone] = useState("");

  const handleContinue = async () => {
    if (phone.trim().length < 7) return;
    await login(phone.trim());
    router.push("/(auth)/otp");
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + "22", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kav}>
        <View style={[styles.inner, { paddingTop: topPad + 60, paddingBottom: botPad + 32, paddingHorizontal: 32 }]}>
          <View style={styles.hero}>
            <View style={[styles.logoRing, { borderColor: colors.primary + "44" }]}>
              <View style={[styles.logoDot, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.brand, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              VEILCHAT
            </Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Private. Secure. Always.
            </Text>
          </View>
          <View style={styles.form}>
            <VeilInput
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 555 000 0000"
              keyboardType="phone-pad"
              leftIcon="call-outline"
              hint="We'll send a verification code"
              error={error ?? undefined}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>
          <VeilButton
            label="Continue"
            onPress={handleContinue}
            loading={isLoading}
            disabled={phone.trim().length < 7}
            fullWidth
          />
          <Text style={[styles.terms, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  inner: { flex: 1, justifyContent: "space-between" },
  hero: { alignItems: "center", gap: 12 },
  logoRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  logoDot: { width: 28, height: 28, borderRadius: 14 },
  brand: { fontSize: 28, letterSpacing: 6 },
  tagline: { fontSize: 15, letterSpacing: 0.5 },
  form: { gap: 10 },
  terms: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
