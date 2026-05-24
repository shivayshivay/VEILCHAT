import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface VeilButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function VeilButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
}: VeilButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };
  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
      ? colors.secondary
      : "transparent";
  const textColor =
    variant === "primary"
      ? colors.primaryForeground
      : colors.foreground;

  return (
    <Animated.View style={[animStyle, fullWidth && { width: "100%" }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.btn,
          { backgroundColor: bg, borderRadius: colors.radius, opacity: disabled ? 0.5 : 1 },
          variant === "ghost" && { borderWidth: 1, borderColor: colors.border },
          fullWidth && { width: "100%" },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <Text style={[styles.label, { color: textColor, fontFamily: "Inter_600SemiBold" }]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 15,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 52,
  },
  label: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
