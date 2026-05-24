import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { useColors } from "@/hooks/useColors";
import { Contact } from "@/types/chat";

interface Props {
  contact: Contact;
  onPress: () => void;
  onCall?: () => void;
}

export function ContactCard({ contact, onPress, onCall }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
    >
      <Avatar name={contact.name} color={contact.avatarColor} size={48} isOnline={contact.isOnline} showOnline />
      <View style={styles.mid}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {contact.name}
          </Text>
          {contact.isVerified && (
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          )}
        </View>
        <Text style={[styles.phone, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {contact.phone}
        </Text>
      </View>
      <View style={styles.actions}>
        {onCall && (
          <Pressable onPress={onCall} style={styles.actionBtn}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
          </Pressable>
        )}
        <Pressable style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 14,
  },
  mid: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontSize: 15 },
  phone: { fontSize: 13 },
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 8 },
});
