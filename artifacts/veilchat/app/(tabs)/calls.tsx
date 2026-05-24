import React, { useState } from "react";
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "@/components/ui/Avatar";
import { CallItem, CallRecord } from "@/components/calls/CallItem";
import { useChat } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

export default function CallsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contacts } = useChat();
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const callTypes: Array<"incoming" | "outgoing" | "missed"> = ["outgoing", "incoming", "missed", "outgoing", "incoming"];

  const records: CallRecord[] = contacts.slice(0, 5).map((c, i) => ({
    id: "call_" + c.id,
    contact: c,
    type: callTypes[i % callTypes.length],
    isVideo: i % 3 === 0,
    timestamp: Date.now() - (i + 1) * 3600000,
    duration: i % 3 === 2 ? 0 : 60 + i * 45,
  }));

  const activeContact = contacts.find((c) => c.id === activeCall);

  const handleCall = (contactId: string) => {
    setActiveCall(contactId);
    setCallTimer(0);
    const ref = setInterval(() => setCallTimer((t) => t + 1), 1000);
    setTimerRef(ref);
  };

  const handleEndCall = () => {
    if (timerRef) clearInterval(timerRef);
    setTimerRef(null);
    setActiveCall(null);
    setCallTimer(0);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Calls</Text>
        <Pressable style={styles.headerBtn}>
          <Ionicons name="add-outline" size={26} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={records.length > 0}
        renderItem={({ item }) => (
          <CallItem record={item} onCall={() => handleCall(item.contact.id)} />
        )}
      />

      <Modal visible={!!activeCall} animationType="slide" statusBarTranslucent>
        <LinearGradient colors={["#0A0A0A", "#111827", "#0A0A0A"]} style={styles.callScreen}>
          <View style={[styles.callTop, { paddingTop: insets.top + 40 }]}>
            <Text style={[styles.callLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {callTimer > 0 ? "Connected" : "Calling..."}
            </Text>
            {activeContact && (
              <Avatar name={activeContact.name} color={activeContact.avatarColor} size={100} />
            )}
            <Text style={[styles.callName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {activeContact?.name ?? ""}
            </Text>
            <Text style={[styles.callTimer, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              {callTimer > 0 ? formatTimer(callTimer) : "Ringing..."}
            </Text>
          </View>
          <View style={[styles.callControls, { paddingBottom: insets.bottom + 40 }]}>
            <Pressable style={[styles.callCtrlBtn, { backgroundColor: "#1F2937" }]}>
              <Ionicons name="mic-off-outline" size={26} color="#fff" />
            </Pressable>
            <Pressable style={[styles.callCtrlBtn, { backgroundColor: "#1F2937" }]}>
              <Ionicons name="volume-high-outline" size={26} color="#fff" />
            </Pressable>
            <Pressable style={[styles.callCtrlBtn, { backgroundColor: "#1F2937" }]}>
              <Ionicons name="videocam-outline" size={26} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleEndCall}
              style={[styles.callCtrlBtn, { backgroundColor: colors.destructive, width: 68, height: 68, borderRadius: 34 }]}
            >
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
            </Pressable>
          </View>
        </LinearGradient>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28 },
  headerBtn: { padding: 6 },
  callScreen: { flex: 1, justifyContent: "space-between" },
  callTop: { alignItems: "center", gap: 16 },
  callLabel: { fontSize: 14, letterSpacing: 1 },
  callName: { fontSize: 28, marginTop: 8 },
  callTimer: { fontSize: 18 },
  callControls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20, paddingHorizontal: 32 },
  callCtrlBtn: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
});
