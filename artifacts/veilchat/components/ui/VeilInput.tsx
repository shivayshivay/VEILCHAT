import React, { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface VeilInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
  rightIcon?: React.ComponentProps<typeof Ionicons>["name"];
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

export const VeilInput = forwardRef<TextInput, VeilInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      isPassword = false,
      style,
      ...props
    },
    ref
  ) => {
    const colors = useColors();
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const borderColor = error
      ? colors.destructive
      : focused
      ? colors.primary
      : colors.border;

    return (
      <View style={styles.wrapper}>
        {label && (
          <Text
            style={[
              styles.label,
              { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
            ]}
          >
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.input,
              borderColor,
              borderRadius: colors.radius,
            },
          ]}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={18}
              color={focused ? colors.primary : colors.mutedForeground}
              style={styles.leftIcon}
            />
          )}
          <TextInput
            ref={ref}
            {...props}
            secureTextEntry={isPassword && !showPassword}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
                paddingLeft: leftIcon ? 0 : 14,
              },
              style,
            ]}
          />
          {isPassword && (
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={styles.rightIconBtn}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}
          {!isPassword && rightIcon && (
            <Pressable onPress={onRightIconPress} style={styles.rightIconBtn}>
              <Ionicons name={rightIcon} size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        {error && (
          <Text
            style={[
              styles.error,
              { color: colors.destructive, fontFamily: "Inter_400Regular" },
            ]}
          >
            {error}
          </Text>
        )}
        {hint && !error && (
          <Text
            style={[
              styles.hint,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

VeilInput.displayName = "VeilInput";

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, marginLeft: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    minHeight: 52,
    overflow: "hidden",
  },
  leftIcon: { paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 15, paddingRight: 14, paddingVertical: 14 },
  rightIconBtn: { paddingHorizontal: 12, paddingVertical: 14 },
  error: { fontSize: 12, marginLeft: 2 },
  hint: { fontSize: 12, marginLeft: 2 },
});
