import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VeilButton } from "@/components/ui/VeilButton";
import { useAuthStore } from "@/store/authStore";
import { useColors } from "@/hooks/useColors";

export default function OtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyOtp, pendingPhone, isLoading, error } = useAuthStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
    if (!digit && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return;
    const ok = await verifyOtp(code);
    if (ok) router.push("/(auth)/profile-setup");
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0);
  const isFull = otp.every((d) => d !== "");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary + "11", colors.background]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kav}>
        <View style={[styles.inner, { paddingTop: topPad + 40, paddingBottom: botPad + 32, paddingHorizontal: 28 }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={[styles.backText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>← Back</Text>
          </Pressable>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Verify your number
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Code sent to {pendingPhone || "your number"}
            </Text>
            <View style={styles.digits}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { refs.current[i] = r; }}
                  value={d}
                  onChangeText={(v) => handleChange(v, i)}
                  keyboardType="numeric"
                  maxLength={1}
                  style={[
                    styles.digit,
                    {
                      backgroundColor: colors.surface,
                      color: colors.foreground,
                      borderColor: d ? colors.primary : colors.border,
                      borderRadius: colors.radius - 4,
                      fontFamily: "Inter_700Bold",
                    },
                  ]}
                  textAlign="center"
                />
              ))}
            </View>
            {error && (
              <Text style={[styles.error, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
                {error}
              </Text>
            )}
            <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Demo code: <Text style={{ color: colors.primary }}>123456</Text>
            </Text>
          </View>
          <VeilButton label="Verify" onPress={handleVerify} loading={isLoading} disabled={!isFull} fullWidth />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  inner: { flex: 1 },
  back: { marginBottom: 32 },
  backText: { fontSize: 15 },
  content: { flex: 1, justifyContent: "center", gap: 16, marginBottom: 32 },
  title: { fontSize: 26 },
  sub: { fontSize: 15 },
  digits: { flexDirection: "row", gap: 10, marginTop: 16 },
  digit: { flex: 1, height: 58, fontSize: 24, borderWidth: 1.5 },
  error: { fontSize: 13 },
  hint: { fontSize: 13 },
});
