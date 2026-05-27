import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { firebaseConfig } from "@/src/config/firebase";

// FirebaseRecaptchaVerifierModal — native only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let FirebaseRecaptchaVerifierModal: any = null;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FirebaseRecaptchaVerifierModal = require("expo-firebase-recaptcha").FirebaseRecaptchaVerifierModal;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { verifyOtp, loginWithPhone, pendingPhone, isLoading, error, setError, isDemoMode } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recaptchaVerifierRef = useRef<any>(null);
  const shakeX = useSharedValue(0);
  const successScale = useSharedValue(1);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 24);
  const isFull = otp.every((d) => d !== "");

  useEffect(() => {
    setError(null);
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) { setCanResend(true); return; }
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-7, { duration: 55 }),
      withTiming(7, { duration: 55 }),
      withTiming(-4, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  }, [shakeX]);

  const triggerSuccess = useCallback(() => {
    successScale.value = withSequence(
      withSpring(1.04, { damping: 12 }),
      withSpring(1, { damping: 14 })
    );
  }, [successScale]);

  const handleChangeText = useCallback((val: string, idx: number) => {
    const cleaned = val.replace(/\D/g, "");
    setError(null);

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, OTP_LENGTH);
      const next = [...otp];
      digits.split("").forEach((d, i) => {
        if (i < OTP_LENGTH) next[i] = d;
      });
      setOtp(next);
      const nextIdx = Math.min(digits.length, OTP_LENGTH - 1);
      setActiveIndex(nextIdx);
      setTimeout(() => inputRefs.current[nextIdx]?.focus(), 0);
      return;
    }

    const digit = cleaned.slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);

    if (digit && idx < OTP_LENGTH - 1) {
      const nextIdx = idx + 1;
      setActiveIndex(nextIdx);
      setTimeout(() => inputRefs.current[nextIdx]?.focus(), 0);
    }
  }, [otp, setError]);

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, idx: number) => {
      if (e.nativeEvent.key === "Backspace") {
        setError(null);
        if (otp[idx] === "" && idx > 0) {
          const next = [...otp];
          next[idx - 1] = "";
          setOtp(next);
          const prevIdx = idx - 1;
          setActiveIndex(prevIdx);
          setTimeout(() => inputRefs.current[prevIdx]?.focus(), 0);
        } else {
          const next = [...otp];
          next[idx] = "";
          setOtp(next);
        }
      }
    },
    [otp, setError]
  );

  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH || isLoading) return;
    const ok = await verifyOtp(code);
    if (ok) {
      triggerSuccess();
      setTimeout(() => router.push("/(auth)/profile-setup"), 200);
    } else {
      triggerShake();
      setOtp(Array(OTP_LENGTH).fill(""));
      setActiveIndex(0);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [otp, isLoading, verifyOtp, triggerShake, triggerSuccess]);

  const handleResend = async () => {
    if (!canResend || resending) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setActiveIndex(0);
    setError(null);
    setResendTimer(RESEND_SECONDS);
    setCanResend(false);
    setResending(true);
    try {
      await loginWithPhone(pendingPhone, recaptchaVerifierRef.current ?? undefined);
    } catch {
      // error set in store
    } finally {
      setResending(false);
    }
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
  };

  const fillDemo = () => {
    setOtp(["1", "2", "3", "4", "5", "6"]);
    setActiveIndex(5);
    setTimeout(() => inputRefs.current[5]?.focus(), 0);
  };

  return (
    <>
      {FirebaseRecaptchaVerifierModal && Platform.OS !== "web" && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifierRef}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification
          title="Verify you're human"
          cancelLabel="Cancel"
        />
      )}

      <KeyboardAvoidingView
        style={styles.root}
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
            <View style={styles.header}>
              <Text style={styles.title}>Enter the code</Text>
              <Text style={styles.subtitle}>
                Sent to{" "}
                <Text style={styles.phone}>{pendingPhone || "your number"}</Text>
              </Text>
            </View>

            <Animated.View style={[styles.digitRow, shakeStyle, successStyle]}>
              {otp.map((d, i) => {
                const isActive = i === activeIndex;
                const isFilled = d !== "";
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setActiveIndex(i);
                      inputRefs.current[i]?.focus();
                    }}
                    style={[
                      styles.digitBox,
                      isActive && styles.digitBoxActive,
                      isFilled && !isActive && styles.digitBoxFilled,
                      error && styles.digitBoxError,
                    ]}
                  >
                    {Platform.OS === "web" ? (
                      <TextInput
                        ref={(r) => { inputRefs.current[i] = r; }}
                        value={d}
                        onChangeText={(v) => handleChangeText(v, i)}
                        onKeyPress={(e) => handleKeyPress(e, i)}
                        onFocus={() => setActiveIndex(i)}
                        keyboardType="numeric"
                        maxLength={6}
                        style={[styles.digitInput, isFilled && styles.digitInputFilled]}
                        textAlign="center"
                        caretHidden
                        selectTextOnFocus
                      />
                    ) : (
                      <TextInput
                        ref={(r) => { inputRefs.current[i] = r; }}
                        value={d}
                        onChangeText={(v) => handleChangeText(v, i)}
                        onKeyPress={(e) => handleKeyPress(e, i)}
                        onFocus={() => setActiveIndex(i)}
                        keyboardType="number-pad"
                        maxLength={6}
                        style={[styles.digitInput, isFilled && styles.digitInputFilled]}
                        textAlign="center"
                        caretHidden
                      />
                    )}
                  </Pressable>
                );
              })}
            </Animated.View>

            {error ? (
              <View style={styles.feedbackRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : isDemoMode ? (
              <View style={styles.feedbackRow}>
                <Ionicons name="information-circle-outline" size={14} color="#374151" />
                <Text style={styles.hint}>
                  Demo mode — tap{" "}
                  <Text style={styles.hintCode} onPress={fillDemo}>
                    123456
                  </Text>{" "}
                  to auto-fill
                </Text>
              </View>
            ) : (
              <View style={styles.feedbackRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#374151" />
                <Text style={styles.hint}>SMS verification code sent</Text>
              </View>
            )}

            <Pressable
              onPress={handleResend}
              disabled={!canResend || resending}
              style={styles.resendBtn}
            >
              <Text style={[styles.resendText, (!canResend || resending) && styles.resendDisabled]}>
                {resending
                  ? "Sending…"
                  : canResend
                  ? "Resend Code"
                  : `Resend in ${resendTimer}s`}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleVerify}
            disabled={!isFull || isLoading}
            style={({ pressed }) => [
              styles.verifyBtn,
              (!isFull || isLoading) && styles.verifyBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {isLoading ? (
              <>
                <View style={styles.spinner} />
                <Text style={styles.verifyBtnText}>Verifying…</Text>
              </>
            ) : (
              <>
                <Text style={styles.verifyBtnText}>Verify Code</Text>
                <Ionicons name="checkmark" size={20} color="#0A0A0A" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const CYAN = "#00F5D4";
const RED = "#EF4444";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  inner: { flex: 1, paddingHorizontal: 28 },
  back: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 40 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#E5E7EB" },
  content: { flex: 1, gap: 24 },
  header: { gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#E5E7EB" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "#6B7280" },
  phone: { fontFamily: "Inter_600SemiBold", color: "#E5E7EB" },
  digitRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 8,
  },
  digitBox: {
    flex: 1,
    maxWidth: 52,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#111827",
    borderWidth: 1.5,
    borderColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  digitBoxActive: {
    borderColor: CYAN,
    backgroundColor: "#00F5D40A",
  },
  digitBoxFilled: {
    borderColor: CYAN + "66",
  },
  digitBoxError: {
    borderColor: RED + "80",
    backgroundColor: RED + "0A",
  },
  digitInput: {
    width: "100%",
    height: "100%",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#E5E7EB",
    textAlign: "center",
  },
  digitInputFilled: { color: CYAN },
  feedbackRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -8 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: RED, flex: 1 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#6B7280" },
  hintCode: {
    fontFamily: "Inter_600SemiBold",
    color: CYAN,
    textDecorationLine: "underline",
  },
  resendBtn: { alignSelf: "flex-start" },
  resendText: { fontFamily: "Inter_500Medium", fontSize: 14, color: CYAN },
  resendDisabled: { color: "#374151" },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYAN,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 16,
  },
  verifyBtnDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  verifyBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#0A0A0A" },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0A0A0A",
    borderTopColor: "transparent",
  },
});
