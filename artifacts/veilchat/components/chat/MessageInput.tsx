import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Message, MessageType } from "@/types/chat";
import { ReplyBar } from "./ReplyBar";
import { useColors } from "@/hooks/useColors";

interface SendPayload {
  text: string;
  replyToId?: string;
  mediaUrl?: string;
  type?: MessageType;
}

interface Props {
  onSend: (payload: SendPayload) => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  isMine?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

const CYAN = "#00F5D4";

export function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  isMine = false,
  onTypingStart,
  onTypingStop,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<{ uri: string; type: MessageType } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 || pendingMedia !== null;
  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0);

  const handleChangeText = useCallback(
    (val: string) => {
      setText(val);
      if (val.length > 0) onTypingStart?.();
      else onTypingStop?.();
    },
    [onTypingStart, onTypingStop]
  );

  const handleSend = useCallback(() => {
    if (!canSend) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend({
      text: text.trim(),
      replyToId: replyTo?.id,
      mediaUrl: pendingMedia?.uri,
      type: pendingMedia?.type,
    });
    setText("");
    setPendingMedia(null);
    onCancelReply();
    onTypingStop?.();
  }, [canSend, text, replyTo, pendingMedia, onSend, onCancelReply, onTypingStop]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow access to your photos to send images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type: MessageType = asset.type === "video" ? "video" : "image";
      setPendingMedia({ uri: asset.uri, type });
    }
  };

  const handleAttach = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Photo Library"],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickImage();
        }
      );
    } else {
      pickImage();
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <ReplyBar
        replyTo={replyTo}
        onCancel={onCancelReply}
        isMine={replyTo?.senderId === "me"}
      />

      {pendingMedia && (
        <View style={styles.mediaPreviewRow}>
          <View style={[styles.mediaPreviewPill, { backgroundColor: colors.surface }]}>
            <Ionicons
              name={pendingMedia.type === "video" ? "videocam" : "image"}
              size={16}
              color={CYAN}
            />
            <Pressable onPress={() => setPendingMedia(null)} hitSlop={6}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.row, { paddingBottom: bottomPad + 8 }]}>
        <Pressable onPress={handleAttach} style={styles.iconBtn} hitSlop={6}>
          <Ionicons name="add-circle-outline" size={27} color={colors.mutedForeground} />
        </Pressable>

        <View
          style={[
            styles.inputWrap,
            { backgroundColor: colors.surface, borderRadius: 22 },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleChangeText}
            placeholder="Message"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            multiline
            maxLength={2000}
            onSubmitEditing={Platform.OS === "web" ? handleSend : undefined}
          />
          <Pressable style={styles.emojiBtn} hitSlop={4}>
            <Ionicons name="happy-outline" size={21} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Pressable
          onPress={canSend ? handleSend : undefined}
          style={[
            styles.sendBtn,
            { backgroundColor: canSend ? CYAN : colors.surface },
          ]}
        >
          <Ionicons
            name={canSend ? "send" : "mic-outline"}
            size={20}
            color={canSend ? "#0A0A0A" : colors.mutedForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mediaPreviewRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  mediaPreviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
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
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
  },
  emojiBtn: { marginLeft: 6, marginBottom: 1 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
});
