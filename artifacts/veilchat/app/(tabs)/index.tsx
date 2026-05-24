import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { VeilInput } from "@/components/ui/VeilInput";
import { useChatStore } from "@/store/chatStore";
import { useColors } from "@/hooks/useColors";
import { useDebounce } from "@/hooks/useDebounce";
import { Conversation } from "@/types/chat";

export default function ChatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations } = useChatStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);

  const filtered = conversations
    .filter((c) => c.contact.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .sort((a, b) => b.lastActivity - a.lastActivity);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Chats
            </Text>
            {totalUnread > 0 && (
              <View style={[styles.unreadPill, { backgroundColor: colors.primary }]}>
                <Text style={[styles.unreadText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                  {totalUnread}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerBtn}>
              <Ionicons name="qr-code-outline" size={22} color={colors.mutedForeground} />
            </Pressable>
            <Pressable style={styles.headerBtn}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>
        <VeilInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations"
          leftIcon="search-outline"
          rightIcon={search.length > 0 ? "close-circle" : undefined}
          onRightIconPress={() => setSearch("")}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: Conversation) => item.contact.id}
        renderItem={({ item }: { item: Conversation }) => (
          <ConversationItem
            conversation={{
              contact: item.contact,
              lastMessage: item.messages[item.messages.length - 1]?.text ?? "",
              lastMessageTime: item.lastActivity,
              unreadCount: item.unreadCount,
              typing: item.isTyping,
            }}
            onPress={() => router.push(`/chat/${item.contact.id}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {search ? "No conversations match your search" : "No conversations yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 28 },
  unreadPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  unreadText: { fontSize: 12 },
  headerActions: { flexDirection: "row", gap: 4 },
  headerBtn: { padding: 6 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center", paddingHorizontal: 40 },
});
