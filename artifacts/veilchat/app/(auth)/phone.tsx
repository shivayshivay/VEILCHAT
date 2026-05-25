import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useAuthStore } from "@/store/authStore";
import { firebaseConfig, isFirebaseConfigured } from "@/src/config/firebase";

const COUNTRY_CODES = [
  { flag: "🇺🇸", code: "+1", label: "US" },
  { flag: "🇬🇧", code: "+44", label: "UK" },
  { flag: "🇮🇳", code: "+91", label: "IN" },
  { flag: "🇩🇪", code: "+49", label: "DE" },
  { flag: "🇫🇷", code: "+33", label: "FR" },
];

export default function PhoneScreen() {
  const insets = useSafeAreaInsets();
  const { loginWithPhone, isLoading, error } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const recaptchaVerifierRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 24);
  const isValid = phone.replace(/\D/g, "").length >= 7;

  const handleContinue = async () => {
    if (!isValid || isLoading) return;
    const fullNumber = `${countryCode.code}${phone.trim().replace(/\s/g, "")}`;
    try {
      await loginWithPhone(fullNumber, recaptchaVerifierRef.current ?? undefined);
      router.push("/(auth)/otp");
    } catch {
      // error already set in store — displayed below
    }
  };

  return (
    <>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifierRef}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
        title="Verify you're human"
        cancelLabel="Cancel"
      />

      <KeyboardAvoidingView
        style={[styles.root]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <LinearGradient
          colors={["#00F5D412", "#0A0A0A"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.4 }}
        />

        <View style={[styles.inner, { paddingTop: topPad + 16, paddingBottom: botPad }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color="#E5E7EB" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.content}>
            <Text style={styles.title}>What's your number?</Text>
            <Text style={styles.subtitle}>
              We'll send a one-time verification code to confirm it's you.
            </Text>

            <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
              <Pressable
                style={styles.countryBtn}
                onPress={() => setShowPicker((v) => !v)}
              >
                <Text style={styles.flag}>{countryCode.flag}</Text>
                <Text style={styles.countryCode}>{countryCode.code}</Text>
                <Ionicons name="chevron-down" size={14} color="#6B7280" />
              </Pressable>

              <TextInput
                ref={inputRef}
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/[^\d\s\-()]/g, ""))}
                placeholder="555 000 0000"
                placeholderTextColor="#374151"
                keyboardType="phone-pad"
                style={styles.phoneInput}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                autoFocus
              />
            </View>

            {showPicker && (
              <View style={styles.picker}>
                {COUNTRY_CODES.map((c) => (
                  <Pressable
                    key={c.code}
                    style={[styles.pickerItem, c.code === countryCode.code && styles.pickerItemActive]}
                    onPress={() => {
                      setCountryCode(c);
                      setShowPicker(false);
                      inputRef.current?.focus();
                    }}
                  >
                    <Text style={styles.flag}>{c.flag}</Text>
                    <Text style={styles.pickerLabel}>{c.label}</Text>
                    <Text style={styles.pickerCode}>{c.code}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <Text style={styles.hint}>
                {isFirebaseConfigured
                  ? "A real SMS verification code will be sent to this number."
                  : "Demo mode — use any number. No SMS will be sent."}
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleContinue}
            disabled={!isValid || isLoading}
            style={({ pressed }) => [
              styles.continueBtn,
              (!isValid || isLoading) && styles.continueBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {isLoading ? (
              <>
                <View style={styles.spinner} />
                <Text style={styles.continueBtnText}>Sending code…</Text>
              </>
            ) : (
              <>
                <Text style={styles.continueBtnText}>Send Code</Text>
                <Ionicons name="arrow-forward" size={18} color="#0A0A0A" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const CYAN = "#00F5D4";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  inner: { flex: 1, paddingHorizontal: 28, gap: 0 },
  back: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 40 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#E5E7EB" },
  content: { flex: 1, justifyContent: "flex-start", gap: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#E5E7EB", letterSpacing: 0.3 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "#6B7280", lineHeight: 22 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1F2937",
    overflow: "hidden",
    marginTop: 8,
  },
  inputRowError: {
    borderColor: "#EF444466",
  },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: "#1F2937",
  },
  flag: { fontSize: 20 },
  countryCode: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#E5E7EB" },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "#E5E7EB",
    letterSpacing: 0.5,
  },
  picker: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  pickerItemActive: { backgroundColor: "#00F5D412" },
  pickerLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: "#E5E7EB" },
  pickerCode: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#6B7280" },
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#374151", lineHeight: 18 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#EF4444", flex: 1 },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYAN,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 16,
  },
  continueBtnDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  continueBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#0A0A0A" },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0A0A0A",
    borderTopColor: "transparent",
  },
});
