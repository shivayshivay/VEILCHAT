import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  isOnline?: boolean;
  showOnline?: boolean;
}

export function Avatar({ name, color, size = 44, isOnline = false, showOnline = false }: AvatarProps) {
  const colors = useColors();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const fontSize = size * 0.36;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + "33",
            borderWidth: 1.5,
            borderColor: color + "66",
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize, color, fontFamily: "Inter_600SemiBold" }]}>
          {initials}
        </Text>
      </View>
      {showOnline && (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: isOnline ? colors.online : colors.mutedForeground,
              borderColor: colors.background,
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: "absolute",
    borderWidth: 2,
  },
});
