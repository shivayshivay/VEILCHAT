import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { useChat } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

export default function ChatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations } = useChat();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.contact.name.toLowerCase().includes(search.toLowerCase())
  );

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Chats
          </Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerBtn}>
              <Ionicons name="qr-code-outline" size={22} color={colors.mutedForeground} />
            </Pressable>
            <Pressable style={styles.headerBtn}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderRadius: colors.radius }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.contact.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => router.push(`/chat/${item.contact.id}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No conversations yet
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
  title: { fontSize: 28 },
  headerActions: { flexDirection: "row", gap: 4 },
  headerBtn: { padding: 6 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
