import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ReactionPicker } from "@/components/chat/ReactionPicker";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useUiStore } from "@/store/uiStore";
import { useChatSocket } from "@/hooks/useSocket";
import { useTypingEmitter } from "@/hooks/useTyping";
import { Contact, Message } from "@/types/chat";

const CYAN = "#00F5D4";
const BG = "#0A0A0A";
const BORDER = "#1F2937";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const user = useAuthStore((s) => s.user);
  const { contacts, getConversation, sendMessage, markRead, addReaction } = useChatStore();
  const { startCall } = useUiStore();

  const contact = contacts.find((c) => c.id === id);
  const conversation = getConversation(id ?? "");
  const messages = conversation?.messages ?? [];

  const flatRef = useRef<FlatList<Message>>(null);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [reactTarget, setReactTarget] = useState<Message | null>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  useChatSocket();

  const { startTyping, stopTyping } = useTypingEmitter(id ?? "");

  React.useEffect(() => {
    if (id) markRead(id);
  }, [id, markRead]);

  const handleSend = useCallback(
    (payload: { text: string; replyToId?: string; mediaUrl?: string }) => {
      if (!id || !user) return;
      sendMessage(id, {
        text: payload.text,
        myId: user.id,
        myName: user.name,
        replyToId: payload.replyToId,
        mediaUrl: payload.mediaUrl,
      });
      setTimeout(() => flatRef.current?.scrollToOffset({ offset: 0, animated: true }), 80);
    },
    [id, user, sendMessage]
  );

  const handleReact = useCallback(
    (emoji: string) => {
      if (!reactTarget || !user || !id) return;
      addReaction(id, reactTarget.id, emoji, user.id);
      setReactTarget(null);
    },
    [reactTarget, user, id, addReaction]
  );

  const handleReactionPress = useCallback(
    (msgId: string, emoji: string) => {
      if (!user || !id) return;
      addReaction(id, msgId, emoji, user.id);
    },
    [user, id, addReaction]
  );

  if (!contact) {
    return (
      <View style={[styles.root, { paddingTop: topPad + 20 }]}>
        <Text style={styles.errorText}>Contact not found</Text>
      </View>
    );
  }

  const reversedMessages = [...messages].reverse();
  const isTyping = conversation?.isTyping ?? false;

  const lastSeen = contact.isOnline
    ? "online"
    : `last seen ${formatLastSeen(contact.lastSeen)}`;

  return (
    <View style={styles.root}>
      <ChatHeader
        contact={contact}
        topPad={topPad}
        onBack={() => router.back()}
        onVideoCall={() => router.push("/(tabs)/calls" as never)}
        onAudioCall={() => startCall(contact.id)}
      />

      <KeyboardAvoidingView style={styles.kav} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatRef}
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              isMine={item.senderId === user?.id || item.senderId === "me"}
              contactName={contact.name}
              myId={user?.id ?? ""}
              onReply={() => setReplyTarget(item)}
              onLongPress={() => setReactTarget(item)}
              onReactionPress={(emoji) => handleReactionPress(item.id, emoji)}
            />
          )}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isTyping ? (
              <TypingIndicator contact={contact} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={16} color={CYAN} />
              </View>
              <Text style={styles.emptyChatText}>
                Messages are end-to-end encrypted
              </Text>
            </View>
          }
        />

        <MessageInput
          onSend={handleSend}
          replyTo={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />
      </KeyboardAvoidingView>

      <ReactionPicker
        visible={reactTarget !== null}
        onReact={handleReact}
        onClose={() => setReactTarget(null)}
      />
    </View>
  );
}

interface HeaderProps {
  contact: Contact;
  topPad: number;
  onBack: () => void;
  onVideoCall: () => void;
  onAudioCall: () => void;
}

function ChatHeader({ contact, topPad, onBack, onVideoCall, onAudioCall }: HeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: topPad + 8 }]}>
      <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color="#E5E7EB" />
      </Pressable>

      <Avatar name={contact.name} color={contact.avatarColor} size={36} isOnline={contact.isOnline} showOnline />

      <View style={styles.headerInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.headerName} numberOfLines={1}>
            {contact.name}
          </Text>
          {contact.isVerified && (
            <Ionicons name="shield-checkmark" size={13} color={CYAN} />
          )}
        </View>
        <Text
          style={[
            styles.headerStatus,
            { color: contact.isOnline ? "#10B981" : "#6B7280" },
          ]}
        >
          {contact.isOnline ? "online" : `last seen ${formatLastSeen(contact.lastSeen)}`}
        </Text>
      </View>

      <View style={styles.headerActions}>
        <Pressable onPress={onVideoCall} style={styles.headerBtn} hitSlop={6}>
          <Ionicons name="videocam-outline" size={22} color="#E5E7EB" />
        </Pressable>
        <Pressable onPress={onAudioCall} style={styles.headerBtn} hitSlop={6}>
          <Ionicons name="call-outline" size={20} color="#E5E7EB" />
        </Pressable>
        <Pressable style={styles.headerBtn} hitSlop={6}>
          <Ionicons name="ellipsis-vertical" size={20} color="#E5E7EB" />
        </Pressable>
      </View>
    </View>
  );
}

function formatLastSeen(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return "recently";
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  kav: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, gap: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#E5E7EB",
  },
  headerStatus: { fontFamily: "Inter_400Regular", fontSize: 12 },
  headerActions: { flexDirection: "row" },
  headerBtn: { padding: 8 },
  listContent: { paddingTop: 8, paddingBottom: 4 },
  emptyChat: { alignItems: "center", paddingTop: 80, gap: 10 },
  lockBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00F5D415",
    borderWidth: 1,
    borderColor: CYAN + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#6B7280",
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    textAlign: "center",
  },
});
