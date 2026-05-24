import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { MessageType } from "@/types/chat";

interface Props {
  mediaUrl: string;
  type: MessageType;
  fileName?: string;
  fileSize?: number;
  isMine: boolean;
  onPress?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaMessage({ mediaUrl, type, fileName, fileSize, isMine, onPress }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (type === "image" || type === "video") {
    return (
      <Pressable onPress={onPress} style={styles.imageWrap}>
        {loading && !error && (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator color="#00F5D4" />
          </View>
        )}
        {error ? (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#374151" />
            <Text style={styles.errorText}>Failed to load</Text>
          </View>
        ) : (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.image}
            contentFit="cover"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}
        {type === "video" && !error && !loading && (
          <View style={styles.playOverlay}>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={20} color="#fff" />
            </View>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={[styles.fileCard, { backgroundColor: isMine ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.07)" }]}>
      <View style={styles.fileIcon}>
        <Ionicons
          name={type === "voice" ? "mic" : "document"}
          size={22}
          color={isMine ? "#0A0A0A" : "#00F5D4"}
        />
      </View>
      <View style={styles.fileInfo}>
        <Text
          style={[styles.fileName, { color: isMine ? "#0A0A0A" : "#E5E7EB" }]}
          numberOfLines={1}
        >
          {fileName ?? "Attachment"}
        </Text>
        {fileSize !== undefined && (
          <Text style={[styles.fileSize, { color: isMine ? "#0A0A0A99" : "#6B7280" }]}>
            {formatBytes(fileSize)}
          </Text>
        )}
      </View>
      <Ionicons
        name="download-outline"
        size={18}
        color={isMine ? "#0A0A0A99" : "#6B7280"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    borderRadius: 10,
    overflow: "hidden",
    width: 220,
    minHeight: 140,
    backgroundColor: "#1F2937",
    marginBottom: 4,
  },
  image: { width: 220, height: 200 },
  imagePlaceholder: {
    width: 220,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    gap: 10,
    marginBottom: 4,
    minWidth: 180,
  },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: { flex: 1, gap: 2 },
  fileName: { fontFamily: "Inter_500Medium", fontSize: 13 },
  fileSize: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
