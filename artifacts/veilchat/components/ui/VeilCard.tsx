import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface VeilCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glass?: boolean;
  padding?: number;
  gap?: number;
}

export function VeilCard({ children, style, glass = false, padding = 16, gap }: VeilCardProps) {
  const colors = useColors();

  const inner = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: glass ? "transparent" : colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
          padding,
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (glass && Platform.OS === "ios") {
    return (
      <BlurView intensity={60} tint="dark" style={[styles.blurWrap, { borderRadius: colors.radius }, style]}>
        {inner}
      </BlurView>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  blurWrap: {
    overflow: "hidden",
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
