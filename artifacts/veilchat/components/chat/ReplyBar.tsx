import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "@/types/chat";

interface Props {
  replyTo: Message | null;
  onCancel: () => void;
  isMine: boolean;
}

const CYAN = "#00F5D4";

export function ReplyBar({ replyTo, onCancel, isMine }: Props) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (replyTo) {
      height.value = withSpring(60, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      height.value = withSpring(0, { damping: 18 });
      opacity.value = withTiming(0, { duration: 120 });
    }
  }, [replyTo]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: "hidden",
  }));

  const displayText = replyTo
    ? replyTo.mediaUrl
      ? "📷 Photo"
      : replyTo.text
    : "";

  return (
    <Animated.View style={animStyle}>
      <View style={styles.container}>
        <View style={styles.accent} />
        <View style={styles.content}>
          <Text style={styles.label}>{isMine ? "You" : "Reply"}</Text>
          <Text style={styles.preview} numberOfLines={1}>
            {displayText}
          </Text>
        </View>
        <Pressable onPress={onCancel} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color="#6B7280" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F1721",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    gap: 10,
    height: 60,
  },
  accent: {
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: CYAN,
  },
  content: { flex: 1, gap: 2 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: CYAN,
  },
  preview: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
  },
  closeBtn: {
    padding: 2,
  },
});
