import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VeilButton } from "@/components/ui/VeilButton";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (phone.trim().length < 7) return;
    setLoading(true);
    await login(phone.trim());
    setLoading(false);
    router.push("/(auth)/otp");
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#00F5D422", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <View style={[styles.inner, { paddingTop: topPad + 60, paddingBottom: botPad + 32, paddingHorizontal: 32 }]}>
          <View style={styles.hero}>
            <View style={[styles.logoRing, { borderColor: colors.primary + "44" }]}>
              <View style={[styles.logoDot, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.brand, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>VEILCHAT</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Private. Secure. Always.
            </Text>
          </View>
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              Phone number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 555 000 0000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderColor: phone.length > 0 ? colors.primary + "66" : colors.border,
                  borderRadius: colors.radius,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              We'll send a verification code
            </Text>
          </View>
          <VeilButton
            label="Continue"
            onPress={handleContinue}
            loading={loading}
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
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  brand: { fontSize: 28, letterSpacing: 6 },
  tagline: { fontSize: 15, letterSpacing: 0.5 },
  form: { gap: 10 },
  label: { fontSize: 14 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  hint: { fontSize: 12, marginTop: 2 },
  terms: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
