import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Message, MessageType } from "@/types/chat";
import { ReplyBar } from "./ReplyBar";
import { useColors } from "@/hooks/useColors";
import { useAdaptiveStore } from "@/store/adaptiveEnhancementStore";
import { useAuthStore } from "@/store/authStore";
import { encodeImageWithMessage } from "@/lib/adaptive-enhancement";
import { uploadMedia } from "@/lib/cloudinary";

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
  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<{
    uri: string;
    type: MessageType;
  } | null>(null);
  const [hiddenText, setHiddenText] = useState("");
  const [enhanceMode, setEnhanceMode] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { keyHex, isEnabled: adaptiveEnabled, isInitialized, initialize } =
    useAdaptiveStore();
  const tokens = useAuthStore((s) => s.tokens);

  React.useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  // Only offer enhancement for image media
  const canEnhance =
    adaptiveEnabled &&
    isInitialized &&
    pendingMedia?.type === "image";

  const canSend = (text.trim().length > 0 || pendingMedia !== null) && !isSending;
  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0);

  const handleChangeText = useCallback(
    (val: string) => {
      setText(val);
      if (val.length > 0) onTypingStart?.();
      else onTypingStop?.();
    },
    [onTypingStart, onTypingStop],
  );

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsSending(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType = pendingMedia?.type;

      if (pendingMedia) {
        const shouldEncode =
          enhanceMode && canEnhance && hiddenText.trim().length > 0 && keyHex && tokens?.accessToken;

        if (shouldEncode) {
          // Encode hidden message into image via server-side steganography
          const stegoBase64 = await encodeImageWithMessage(
            pendingMedia.uri,
            hiddenText.trim(),
            keyHex!,
            tokens!.accessToken,
          );
          if (stegoBase64) {
            // Use data URI — preserves every pixel of LSB data
            mediaUrl = `data:image/png;base64,${stegoBase64}`;
            mediaType = "image";
          } else {
            Alert.alert(
              "Enhancement unavailable",
              "Sending image without enhancement.",
            );
            const result = await uploadMedia(pendingMedia.uri).catch(() => null);
            mediaUrl = result?.url ?? pendingMedia.uri;
          }
        } else {
          // Regular upload
          const result = await uploadMedia(pendingMedia.uri).catch(() => null);
          mediaUrl = result?.url ?? pendingMedia.uri;
        }
      }

      onSend({
        text: text.trim(),
        replyToId: replyTo?.id,
        mediaUrl,
        type: mediaType,
      });
    } finally {
      setText("");
      setPendingMedia(null);
      setHiddenText("");
      setEnhanceMode(false);
      onCancelReply();
      onTypingStop?.();
      setIsSending(false);
    }
  }, [
    canSend,
    text,
    replyTo,
    pendingMedia,
    hiddenText,
    enhanceMode,
    canEnhance,
    keyHex,
    tokens,
    onSend,
    onCancelReply,
    onTypingStop,
  ]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Allow access to your photos to send images.",
      );
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
        { options: ["Cancel", "Photo Library"], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) pickImage();
        },
      );
    } else {
      pickImage();
    }
  };

  const toggleEnhance = () => {
    if (!adaptiveEnabled) {
      Alert.alert(
        "Smart Enhancement",
        "Enable Smart Enhancement in Settings to embed secret notes in images.",
      );
      return;
    }
    setEnhanceMode((v) => !v);
    if (enhanceMode) setHiddenText("");
  };

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.background, borderTopColor: colors.border },
      ]}
    >
      <ReplyBar
        replyTo={replyTo}
        onCancel={onCancelReply}
        isMine={replyTo?.senderId === "me"}
      />

      {/* Media preview pill */}
      {pendingMedia && (
        <View style={styles.mediaPreviewRow}>
          <View
            style={[
              styles.mediaPreviewPill,
              { backgroundColor: colors.surface },
              enhanceMode && canEnhance && styles.mediaPreviewEnhanced,
            ]}
          >
            <Ionicons
              name={pendingMedia.type === "video" ? "videocam" : "image"}
              size={16}
              color={enhanceMode && canEnhance ? CYAN : colors.mutedForeground}
            />
            {enhanceMode && canEnhance && (
              <Text style={styles.enhancedLabel}>✦ Enhanced</Text>
            )}
            <Pressable onPress={() => { setPendingMedia(null); setHiddenText(""); }} hitSlop={6}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Secret note input (shown when enhance mode is active + image selected) */}
      {enhanceMode && canEnhance && (
        <View style={styles.hiddenInputRow}>
          <View style={styles.hiddenInputWrap}>
            <Text style={styles.hiddenInputLabel}>✦ Secret note</Text>
            <TextInput
              value={hiddenText}
              onChangeText={setHiddenText}
              placeholder="Only sender & recipient with key can read…"
              placeholderTextColor="#4B5563"
              style={styles.hiddenInput}
              multiline
              maxLength={500}
            />
          </View>
        </View>
      )}

      {/* Main input row */}
      <View style={[styles.row, { paddingBottom: bottomPad + 8 }]}>
        <Pressable onPress={handleAttach} style={styles.iconBtn} hitSlop={6}>
          <Ionicons
            name="add-circle-outline"
            size={27}
            color={colors.mutedForeground}
          />
        </Pressable>

        {/* Enhancement toggle (only shown when image is selected) */}
        {pendingMedia?.type === "image" && isInitialized && (
          <Pressable
            onPress={toggleEnhance}
            style={[
              styles.enhanceBtn,
              enhanceMode && styles.enhanceBtnActive,
            ]}
            hitSlop={6}
          >
            <Text
              style={[
                styles.enhanceBtnText,
                { color: enhanceMode ? CYAN : colors.mutedForeground },
              ]}
            >
              ✦
            </Text>
          </Pressable>
        )}

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
            <Ionicons
              name="happy-outline"
              size={21}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={canSend ? handleSend : undefined}
          style={[
            styles.sendBtn,
            { backgroundColor: canSend ? CYAN : colors.surface },
          ]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#0A0A0A" />
          ) : (
            <Ionicons
              name={canSend ? "send" : "mic-outline"}
              size={20}
              color={canSend ? "#0A0A0A" : colors.mutedForeground}
            />
          )}
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
  mediaPreviewEnhanced: {
    borderWidth: 1,
    borderColor: CYAN + "40",
  },
  enhancedLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: CYAN,
  },
  hiddenInputRow: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  hiddenInputWrap: {
    backgroundColor: "#0D1117",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYAN + "30",
    padding: 12,
  },
  hiddenInputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: CYAN,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  hiddenInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#E5E7EB",
    lineHeight: 20,
    maxHeight: 80,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
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
  enhanceBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  enhanceBtnActive: {
    backgroundColor: CYAN + "15",
  },
  enhanceBtnText: {
    fontSize: 18,
    lineHeight: 22,
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
  },
});
