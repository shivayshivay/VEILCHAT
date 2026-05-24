import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { useColors } from "@/hooks/useColors";
import { Contact } from "@/context/ChatContext";

export type CallType = "incoming" | "outgoing" | "missed";

export interface CallRecord {
  id: string;
  contact: Contact;
  type: CallType;
  isVideo: boolean;
  timestamp: number;
  duration: number;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const d = new Date(ts);
  if (diff < 86400000) {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  if (diff < 604800000) return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDuration(s: number): string {
  if (s === 0) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

interface Props {
  record: CallRecord;
  onCall: () => void;
}

export function CallItem({ record, onCall }: Props) {
  const colors = useColors();
  const { contact, type, isVideo, timestamp, duration } = record;

  const iconName = type === "incoming" ? "call-outline" : type === "outgoing" ? "arrow-up-circle-outline" : "arrow-down-circle-outline";
  const iconColor = type === "missed" ? colors.destructive : colors.primary;

  return (
    <View style={styles.row}>
      <Avatar name={contact.name} color={contact.avatarColor} size={48} />
      <View style={styles.mid}>
        <Text style={[styles.name, { color: type === "missed" ? colors.destructive : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {contact.name}
        </Text>
        <View style={styles.subRow}>
          <Ionicons name={iconName as any} size={13} color={iconColor} />
          <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {type === "missed" ? "Missed" : type === "incoming" ? "Incoming" : "Outgoing"}
            {duration > 0 ? ` · ${formatDuration(duration)}` : ""}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {formatTime(timestamp)}
        </Text>
        <Pressable onPress={onCall} style={styles.callBtn}>
          <Ionicons
            name={isVideo ? "videocam-outline" : "call-outline"}
            size={22}
            color={colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  mid: { flex: 1, gap: 3 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { fontSize: 15 },
  sub: { fontSize: 13 },
  right: { alignItems: "flex-end", gap: 6 },
  time: { fontSize: 12 },
  callBtn: { padding: 4 },
});
