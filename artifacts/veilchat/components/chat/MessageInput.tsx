import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Props {
  onSend: (text: string) => void;
}

export function MessageInput({ onSend }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setText("");
  };

  const canSend = text.trim().length > 0;
  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: bottomPad + 10,
        },
      ]}
    >
      <View style={[styles.row]}>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="add-circle-outline" size={26} color={colors.mutedForeground} />
        </Pressable>
        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderRadius: colors.radius + 8 }]}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            multiline
            maxLength={2000}
            returnKeyType="default"
            onSubmitEditing={Platform.OS === "web" ? handleSend : undefined}
          />
          <Pressable style={styles.emojiBtn}>
            <Ionicons name="happy-outline" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <Pressable
          onPress={canSend ? handleSend : undefined}
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend ? colors.primary : colors.surface,
              borderRadius: 22,
            },
          ]}
        >
          <Ionicons
            name={canSend ? "send" : "mic-outline"}
            size={20}
            color={canSend ? colors.primaryForeground : colors.mutedForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
  },
  emojiBtn: {
    marginLeft: 6,
    marginBottom: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
