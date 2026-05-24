import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

type BadgeVariant = "primary" | "success" | "destructive" | "muted";

interface VeilBadgeProps {
  label: string | number;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  style?: ViewStyle;
  dot?: boolean;
}

export function VeilBadge({ label, variant = "primary", size = "md", style, dot = false }: VeilBadgeProps) {
  const colors = useColors();

  const bgMap: Record<BadgeVariant, string> = {
    primary: colors.primary,
    success: colors.online,
    destructive: colors.destructive,
    muted: colors.muted,
  };
  const textMap: Record<BadgeVariant, string> = {
    primary: colors.primaryForeground,
    success: "#fff",
    destructive: "#fff",
    muted: colors.mutedForeground,
  };

  const bg = bgMap[variant];
  const textColor = textMap[variant];

  if (dot) {
    return (
      <View style={[styles.dot, { backgroundColor: bg }, style]} />
    );
  }

  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          minWidth: isSmall ? 16 : 20,
          height: isSmall ? 16 : 20,
          borderRadius: isSmall ? 8 : 10,
          paddingHorizontal: isSmall ? 4 : 6,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontFamily: "Inter_600SemiBold",
            fontSize: isSmall ? 10 : 11,
          },
        ]}
      >
        {typeof label === "number" && label > 99 ? "99+" : label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
  label: { lineHeight: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
