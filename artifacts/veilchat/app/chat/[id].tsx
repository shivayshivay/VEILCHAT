import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useUiStore } from "@/store/uiStore";
import { useColors } from "@/hooks/useColors";
import { Message } from "@/types/chat";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { contacts, getMessages, sendMessage, markRead } = useChatStore();
  const { startCall } = useUiStore();

  const contact = contacts.find((c) => c.id === id);
  const messages = getMessages(id ?? "");
  const flatRef = useRef<FlatList<Message>>(null);

  React.useEffect(() => {
    if (id) markRead(id);
  }, [id, markRead]);

  const handleSend = useCallback(
    (text: string) => {
      if (!id || !user) return;
      sendMessage(id, text, user.id);
    },
    [id, user, sendMessage]
  );

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!contact) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad + 20 }]}>
        <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Contact not found</Text>
      </View>
    );
  }

  const reversedMessages = [...messages].reverse();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </Pressable>
        <Avatar name={contact.name} color={contact.avatarColor} size={36} isOnline={contact.isOnline} showOnline />
        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text style={[styles.headerName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
              {contact.name}
            </Text>
            {contact.isVerified && (
              <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.headerStatus, { color: contact.isOnline ? colors.online : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {contact.isOnline ? "online" : "last seen recently"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={() => router.push("/(tabs)/calls" as any)}>
            <Ionicons name="videocam-outline" size={22} color={colors.foreground} />
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => startCall(contact.id)}>
            <Ionicons name="call-outline" size={20} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.kav} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatRef}
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item} isMine={item.senderId === user?.id} />
          )}
          inverted
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyChatText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Messages are end-to-end encrypted
              </Text>
            </View>
          }
        />
        <MessageInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, gap: 1 },
  headerNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerName: { fontSize: 15 },
  headerStatus: { fontSize: 12 },
  headerActions: { flexDirection: "row" },
  headerBtn: { padding: 8 },
  kav: { flex: 1 },
  emptyChat: { flex: 1, alignItems: "center", paddingTop: 100, gap: 8 },
  emptyChatText: { fontSize: 13 },
});
