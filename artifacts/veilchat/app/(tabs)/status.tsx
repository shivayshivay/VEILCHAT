import React, { useState } from "react";
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "@/components/ui/Avatar";
import { useChatStore } from "@/store/chatStore";
import { useColors } from "@/hooks/useColors";

const MY_STATUS = {
  text: "Available",
  time: Date.now() - 600000,
};

function formatAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const STATUS_TEXTS = [
  "Busy with work 🔒", "At the gym 💪", "In a meeting",
  "Travelling ✈️", "Available", "Do not disturb",
];

export default function StatusScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contacts } = useChatStore();
  const [viewing, setViewing] = useState<string | null>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const contactsWithStatus = contacts.map((c, i) => ({
    contact: c,
    statusText: STATUS_TEXTS[i % STATUS_TEXTS.length],
    statusTime: Date.now() - (i + 1) * 1800000,
    seen: i > 2,
  }));

  const viewingContact = contactsWithStatus.find((c) => c.contact.id === viewing);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Status</Text>
        <Pressable style={styles.headerBtn}>
          <Ionicons name="search-outline" size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <FlatList
        data={[{ type: "mine" }, ...contactsWithStatus.map((c) => ({ type: "contact", data: c }))]}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20, gap: 0 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Recent updates
          </Text>
        }
        renderItem={({ item }) => {
          if (item.type === "mine") {
            return (
              <View style={styles.statusRow}>
                <View style={styles.myAvatarWrap}>
                  <Avatar name="Me" color={colors.primary} size={52} />
                  <View style={[styles.addDot, { backgroundColor: colors.primary }]}>
                    <Ionicons name="add" size={14} color={colors.primaryForeground} />
                  </View>
                </View>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>My Status</Text>
                  <Text style={[styles.statusText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {MY_STATUS.text} · {formatAgo(MY_STATUS.time)}
                  </Text>
                </View>
                <Pressable style={styles.editBtn}>
                  <Ionicons name="pencil-outline" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            );
          }
          const { contact, statusText, statusTime, seen } = (item as any).data;
          return (
            <Pressable
              style={styles.statusRow}
              onPress={() => setViewing(contact.id)}
            >
              <View style={[styles.ringWrap, { borderColor: seen ? colors.border : colors.primary }]}>
                <Avatar name={contact.name} color={contact.avatarColor} size={48} />
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{contact.name}</Text>
                <Text style={[styles.statusText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {statusText} · {formatAgo(statusTime)}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Modal visible={!!viewing} animationType="slide" statusBarTranslucent>
        <View style={[styles.storyView, { backgroundColor: colors.background }]}>
          <LinearGradient colors={["rgba(0,0,0,0.8)", "transparent"]} style={styles.storyGradientTop} />
          {viewingContact && (
            <View style={[styles.storyHeader, { paddingTop: insets.top + 20 }]}>
              <Avatar name={viewingContact.contact.name} color={viewingContact.contact.avatarColor} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.storyName, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  {viewingContact.contact.name}
                </Text>
                <Text style={[styles.storyTime, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                  {formatAgo(viewingContact.statusTime)}
                </Text>
              </View>
              <Pressable onPress={() => setViewing(null)} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
          )}
          <View style={styles.storyContent}>
            <Text style={[styles.storyBigText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {viewingContact?.statusText}
            </Text>
          </View>
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.storyGradientBottom} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28 },
  headerBtn: { padding: 6 },
  sectionLabel: { fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, marginTop: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 14 },
  myAvatarWrap: { position: "relative" },
  addDot: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ringWrap: { width: 54, height: 54, borderRadius: 27, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  statusInfo: { flex: 1, gap: 2 },
  statusName: { fontSize: 15 },
  statusText: { fontSize: 13 },
  editBtn: { padding: 8 },
  storyView: { flex: 1, justifyContent: "center", alignItems: "center" },
  storyGradientTop: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  storyGradientBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200 },
  storyHeader: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 14 },
  storyName: { fontSize: 16 },
  storyTime: { fontSize: 12 },
  storyContent: { alignItems: "center", paddingHorizontal: 40 },
  storyBigText: { fontSize: 32, textAlign: "center", lineHeight: 44 },
});
