import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useAdaptiveStore } from "@/store/adaptiveEnhancementStore";
import { scanImageForMessage } from "@/lib/adaptive-enhancement";

const CYAN = "#00F5D4";

type ScanStatus = "idle" | "scanning" | "found" | "empty" | "nokey" | "error";

interface Props {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function AdaptiveScanner({ visible, imageUrl, onClose }: Props) {
  const tokens = useAuthStore((s) => s.tokens);
  const { keyHex, isInitialized, initialize } = useAdaptiveStore();

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (visible) {
      setStatus("idle");
      setMessage(null);
      runScan();
    }
  }, [visible, imageUrl]);

  async function runScan() {
    if (!keyHex) {
      setStatus("nokey");
      return;
    }
    if (!tokens?.accessToken) {
      setStatus("error");
      return;
    }
    setStatus("scanning");
    try {
      const result = await scanImageForMessage(
        imageUrl,
        keyHex,
        tokens.accessToken,
      );
      if (result !== null) {
        setMessage(result);
        setStatus("found");
      } else {
        setStatus("empty");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badge}>
                <Text style={styles.star}>✦</Text>
              </View>
              <View>
                <Text style={styles.title}>Smart Enhancement</Text>
                <Text style={styles.subtitle}>AI-powered image analysis</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Body */}
          <View style={styles.body}>
            {status === "idle" || status === "scanning" ? (
              <View style={styles.row}>
                <ActivityIndicator color={CYAN} size="small" />
                <Text style={styles.scanningText}>Analyzing image…</Text>
              </View>
            ) : status === "found" && message ? (
              <View style={styles.foundWrap}>
                <View style={styles.foundHeader}>
                  <Ionicons
                    name="shield-checkmark"
                    size={14}
                    color={CYAN}
                  />
                  <Text style={styles.foundLabel}>Enhancement decoded</Text>
                </View>
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{message}</Text>
                </View>
                <Text style={styles.hint}>
                  🔒 Decrypted with your private key
                </Text>
              </View>
            ) : status === "empty" ? (
              <View style={styles.row}>
                <Ionicons name="image-outline" size={18} color="#6B7280" />
                <Text style={styles.mutedText}>
                  No enhancement detected in this image.
                </Text>
              </View>
            ) : status === "nokey" ? (
              <View style={styles.row}>
                <Ionicons name="key-outline" size={18} color="#F59E0B" />
                <Text style={[styles.mutedText, { color: "#F59E0B" }]}>
                  Enhancement key not set up. Enable in Settings.
                </Text>
              </View>
            ) : (
              <View style={styles.row}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#EF4444"
                />
                <Text style={[styles.mutedText, { color: "#EF4444" }]}>
                  Scan failed. Check your connection and try again.
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          {status === "error" && (
            <Pressable style={styles.retryBtn} onPress={runScan}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1F2937",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CYAN + "18",
    borderWidth: 1,
    borderColor: CYAN + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  star: { fontSize: 16, color: CYAN },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#E5E7EB",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  divider: { height: 1, backgroundColor: "#1F2937" },
  body: { padding: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scanningText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9CA3AF",
  },
  foundWrap: { gap: 12 },
  foundHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  foundLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: CYAN,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  messageBox: {
    backgroundColor: "#0A0A0A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CYAN + "30",
    padding: 14,
  },
  messageText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#E5E7EB",
    lineHeight: 22,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#6B7280",
  },
  mutedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
    flex: 1,
    lineHeight: 19,
  },
  retryBtn: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#1F2937",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#E5E7EB",
  },
});
