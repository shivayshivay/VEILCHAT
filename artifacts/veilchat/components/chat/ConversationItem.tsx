import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Avatar } from "@/components/ui/Avatar";
import { useColors } from "@/hooks/useColors";
import { Conversation } from "@/context/ChatContext";

interface Props {
  conversation: Conversation;
  onPress: () => void;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const d = new Date(ts);
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  if (diff < 604800000) {
    return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function ConversationItem({ conversation, onPress }: Props) {
  const colors = useColors();
  const { contact, lastMessage, lastMessageTime, unreadCount } = conversation;

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
    >
      <Avatar name={contact.name} color={contact.avatarColor} size={52} isOnline={contact.isOnline} showOnline />
      <View style={styles.mid}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
            {contact.name}
          </Text>
          <Text style={[styles.time, { color: unreadCount > 0 ? colors.primary : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {formatTime(lastMessageTime)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.preview,
              { color: unreadCount > 0 ? colors.foreground : colors.mutedForeground, fontFamily: unreadCount > 0 ? "Inter_500Medium" : "Inter_400Regular" },
            ]}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
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
  mid: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
  },
});
