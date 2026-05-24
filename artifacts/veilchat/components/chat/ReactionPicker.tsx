import React, { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "💀"];

interface Props {
  visible: boolean;
  onReact: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionPicker({ visible, onReact, onClose }: Props) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = withTiming(0.7, { duration: 120 });
      opacity.value = withTiming(0, { duration: 120 });
    }
  }, [visible]);

  const pickerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.pickerWrap, pickerStyle]}>
          <View style={styles.picker}>
            {REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => onReact(emoji)}
                style={({ pressed }) => [styles.emojiBtn, pressed && styles.emojiBtnPressed]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.arrow} />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerWrap: {
    alignItems: "center",
  },
  picker: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  emojiBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnPressed: {
    backgroundColor: "#374151",
    transform: [{ scale: 1.25 }],
  },
  emoji: {
    fontSize: 26,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#1F2937",
    marginTop: -1,
  },
});
