import React from "react";
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "@/components/ui/Avatar";
import { CallItem } from "@/components/calls/CallItem";
import { useChatStore } from "@/store/chatStore";
import { useUiStore } from "@/store/uiStore";
import { useColors } from "@/hooks/useColors";

export default function CallsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { callRecords, contacts } = useChatStore();
  const { activeCallContactId, callTimer, startCall, endCall } = useUiStore();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const activeContact = contacts.find((c) => c.id === activeCallContactId);

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
        data={callRecords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CallItem record={item} onCall={() => startCall(item.contact.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="call-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No recent calls
            </Text>
          </View>
        }
      />

      <Modal visible={!!activeCallContactId} animationType="slide" statusBarTranslucent>
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
            {[
              { icon: "mic-off-outline", label: "Mute" },
              { icon: "volume-high-outline", label: "Speaker" },
              { icon: "videocam-outline", label: "Video" },
            ].map((btn) => (
              <View key={btn.icon} style={styles.callCtrlWrap}>
                <Pressable style={[styles.callCtrlBtn, { backgroundColor: colors.secondary }]}>
                  <Ionicons name={btn.icon as any} size={24} color="#fff" />
                </Pressable>
                <Text style={[styles.callCtrlLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {btn.label}
                </Text>
              </View>
            ))}
            <View style={styles.callCtrlWrap}>
              <Pressable
                onPress={endCall}
                style={[styles.callCtrlBtn, { backgroundColor: colors.destructive, width: 68, height: 68, borderRadius: 34 }]}
              >
                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
              </Pressable>
              <Text style={[styles.callCtrlLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                End
              </Text>
            </View>
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
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  callScreen: { flex: 1, justifyContent: "space-between" },
  callTop: { alignItems: "center", gap: 16 },
  callLabel: { fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" },
  callName: { fontSize: 28, marginTop: 8 },
  callTimer: { fontSize: 18 },
  callControls: { flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: 20, paddingHorizontal: 24 },
  callCtrlWrap: { alignItems: "center", gap: 8 },
  callCtrlBtn: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  callCtrlLabel: { fontSize: 11 },
});
