import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { Message, MessageReaction } from "@/types/chat";
import { MediaMessage } from "./MediaMessage";

const CYAN = "#00F5D4";
const CARD = "#111827";
const BG = "#0A0A0A";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function StatusTick({ status }: { status: Message["status"] }) {
  if (status === "pending") {
    return <Ionicons name="time-outline" size={12} color="rgba(0,0,0,0.45)" />;
  }
  if (status === "failed") {
    return <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />;
  }
  const double = status === "delivered" || status === "read";
  const color = status === "read" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.45)";
  return (
    <Ionicons name={double ? "checkmark-done" : "checkmark"} size={13} color={color} />
  );
}

function ReplyQuote({
  text,
  isMine,
}: {
  text: string;
  isMine: boolean;
}) {
  return (
    <View style={[styles.replyQuote, { borderLeftColor: isMine ? "rgba(0,0,0,0.3)" : CYAN }]}>
      <Text
        style={[styles.replyQuoteText, { color: isMine ? "rgba(0,0,0,0.6)" : "#9CA3AF" }]}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
}

function ReactionsStrip({
  reactions,
  isMine,
  myId,
  onPress,
}: {
  reactions: MessageReaction[];
  isMine: boolean;
  myId: string;
  onPress: (emoji: string) => void;
}) {
  return (
    <View style={[styles.reactionsRow, isMine ? styles.reactionsRight : styles.reactionsLeft]}>
      {reactions.map((r) => {
        const reacted = r.userIds.includes(myId);
        return (
          <Pressable
            key={r.emoji}
            onPress={() => onPress(r.emoji)}
            style={[styles.reactionPill, reacted && styles.reactionPillActive]}
          >
            <Text style={styles.reactionEmoji}>{r.emoji}</Text>
            {r.userIds.length > 1 && (
              <Text style={[styles.reactionCount, { color: reacted ? CYAN : "#9CA3AF" }]}>
                {r.userIds.length}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

interface Props {
  message: Message;
  isMine: boolean;
  contactName?: string;
  myId: string;
  onReply: () => void;
  onLongPress: () => void;
  onReactionPress: (emoji: string) => void;
  onScan?: () => void;
}

const REPLY_THRESHOLD = 42;

export function ChatBubble({
  message,
  isMine,
  contactName,
  myId,
  onReply,
  onLongPress,
  onReactionPress,
  onScan,
}: Props) {
  const translateX = useSharedValue(0);
  const replyIconScale = useSharedValue(0);

  const triggerReply = useCallback(() => {
    onReply();
  }, [onReply]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([12, 9999])
    .failOffsetY([-18, 18])
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = Math.min(e.translationX * 0.55, 65);
        replyIconScale.value = Math.min(translateX.value / REPLY_THRESHOLD, 1);
      }
    })
    .onEnd(() => {
      if (translateX.value >= REPLY_THRESHOLD * 0.9) {
        runOnJS(triggerReply)();
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      replyIconScale.value = withTiming(0, { duration: 150 });
    });

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const replyIconStyle = useAnimatedStyle(() => ({
    opacity: replyIconScale.value,
    transform: [{ scale: 0.5 + replyIconScale.value * 0.5 }],
  }));

  const bubbleBg = isMine ? CYAN : CARD;
  const textColor = isMine ? BG : "#E5E7EB";
  const metaColor = isMine ? "rgba(0,0,0,0.5)" : "#6B7280";
  const hasReactions = (message.reactions?.length ?? 0) > 0;

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={[
          styles.outerRow,
          isMine ? styles.outerRight : styles.outerLeft,
        ]}
      >
        {/* Reply hint icon - slides in from left */}
        <Animated.View style={[styles.replyHint, replyIconStyle]}>
          <Ionicons name="arrow-undo" size={18} color={CYAN} />
        </Animated.View>

        <Animated.View
          style={[styles.bubbleWrap, isMine ? styles.bubbleRight : styles.bubbleLeft, bubbleAnimStyle]}
        >
          <Pressable onLongPress={onLongPress} delayLongPress={360}>
            <View
              style={[
                styles.bubble,
                { backgroundColor: bubbleBg },
                isMine ? styles.bubbleShapeRight : styles.bubbleShapeLeft,
                message.isOptimistic && styles.bubbleOptimistic,
              ]}
            >
              {/* Reply quote */}
              {message.replyToText ? (
                <ReplyQuote text={message.replyToText} isMine={isMine} />
              ) : null}

              {/* Media attachment */}
              {message.mediaUrl ? (
                <View style={styles.mediaWrap}>
                  <MediaMessage
                    mediaUrl={message.mediaUrl}
                    type={message.type}
                    fileName={message.fileName}
                    fileSize={message.fileSize}
                    isMine={isMine}
                  />
                  {/* Smart Enhancement scan button */}
                  {message.type === "image" && onScan ? (
                    <Pressable
                      onPress={onScan}
                      style={styles.scanBtn}
                      hitSlop={4}
                    >
                      <Text style={styles.scanBtnText}>✦</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {/* Text */}
              {message.text ? (
                <Text style={[styles.text, { color: textColor }]}>
                  {message.text}
                </Text>
              ) : null}

              {/* Meta row */}
              <View style={[styles.meta, message.mediaUrl && !message.text ? styles.metaOverlay : null]}>
                {message.editedAt ? (
                  <Text style={[styles.edited, { color: metaColor }]}>edited · </Text>
                ) : null}
                <Text style={[styles.time, { color: metaColor }]}>
                  {formatTime(message.timestamp)}
                </Text>
                {isMine ? <StatusTick status={message.status} /> : null}
              </View>
            </View>
          </Pressable>

          {/* Reactions strip */}
          {hasReactions ? (
            <ReactionsStrip
              reactions={message.reactions!}
              isMine={isMine}
              myId={myId}
              onPress={onReactionPress}
            />
          ) : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  outerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  outerLeft: { justifyContent: "flex-start" },
  outerRight: { justifyContent: "flex-end" },
  replyHint: {
    position: "absolute",
    left: 4,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  bubbleWrap: { maxWidth: "80%", zIndex: 1 },
  bubbleLeft: { alignItems: "flex-start" },
  bubbleRight: { alignItems: "flex-end" },
  bubble: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 16,
  },
  bubbleShapeLeft: { borderBottomLeftRadius: 4 },
  bubbleShapeRight: { borderBottomRightRadius: 4 },
  bubbleOptimistic: { opacity: 0.75 },
  mediaWrap: { position: "relative" },
  scanBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,212,0.4)",
  },
  scanBtnText: { fontSize: 12, color: "#00F5D4" },
  replyQuote: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 6,
    opacity: 0.9,
  },
  replyQuoteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  text: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    marginTop: 3,
  },
  metaOverlay: {
    position: "absolute",
    bottom: 6,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  edited: { fontFamily: "Inter_400Regular", fontSize: 10 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11 },
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 3,
    marginBottom: 2,
  },
  reactionsLeft: { justifyContent: "flex-start" },
  reactionsRight: { justifyContent: "flex-end" },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: "#374151",
  },
  reactionPillActive: {
    backgroundColor: "#00F5D415",
    borderColor: CYAN + "66",
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});
