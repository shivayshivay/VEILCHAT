import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

const AVATAR_COLORS = [
  { id: "cyan", color: "#00F5D4" },
  { id: "purple", color: "#7C3AED" },
  { id: "amber", color: "#F59E0B" },
  { id: "red", color: "#EF4444" },
  { id: "blue", color: "#3B82F6" },
  { id: "green", color: "#10B981" },
  { id: "pink", color: "#EC4899" },
  { id: "orange", color: "#F97316" },
];

function AvatarPreview({ name, color, size = 80 }: { name: string; color: string; size?: number }) {
  const initials = name
    ? name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?"
    : "?";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + "2A",
        borderWidth: 2,
        borderColor: color + "80",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: size * 0.34, color }}>
        {initials}
      </Text>
    </View>
  );
}

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { setupProfile, isLoading, error } = useAuthStore();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].color);
  const [nameFocused, setNameFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);

  const avatarScale = useSharedValue(1);
  const avatarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 24);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    avatarScale.value = withSpring(1.12, { damping: 10 }, () => {
      avatarScale.value = withSpring(1, { damping: 10 });
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    await setupProfile(name.trim(), bio.trim());
    router.replace("/(tabs)");
  };

  const canSave = name.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[selectedColor + "18", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.inner, { paddingTop: topPad + 24, paddingBottom: botPad + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>
            Let your contacts know who you are
          </Text>
        </View>

        <View style={styles.avatarSection}>
          <Animated.View style={avatarAnimStyle}>
            <AvatarPreview name={name} color={selectedColor} size={96} />
          </Animated.View>
          <View style={styles.colorPicker}>
            {AVATAR_COLORS.map(({ id, color }) => (
              <Pressable
                key={id}
                onPress={() => handleColorSelect(color)}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorDotSelected,
                ]}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={12} color="#0A0A0A" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Your name</Text>
            <View style={[styles.inputWrap, nameFocused && styles.inputFocused]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={nameFocused ? selectedColor : "#6B7280"}
                style={styles.inputIcon}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Alex Mercer"
                placeholderTextColor="#374151"
                style={styles.textInput}
                maxLength={40}
                autoFocus
              />
              <Text style={styles.charCount}>{name.length}/40</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio (optional)</Text>
            <View style={[styles.inputWrap, styles.bioWrap, bioFocused && styles.inputFocused]}>
              <TextInput
                value={bio}
                onChangeText={setBio}
                onFocus={() => setBioFocused(true)}
                onBlur={() => setBioFocused(false)}
                placeholder="What's on your mind?"
                placeholderTextColor="#374151"
                style={[styles.textInput, styles.bioInput]}
                maxLength={120}
                multiline
                numberOfLines={3}
              />
            </View>
            <Text style={styles.charCountRight}>{bio.length}/120</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!canSave || isLoading}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: selectedColor },
            (!canSave || isLoading) && styles.saveBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveBtnText}>
            {isLoading ? "Setting up..." : "Enter VEILCHAT"}
          </Text>
          {!isLoading && <Ionicons name="arrow-forward" size={18} color="#0A0A0A" />}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 28, gap: 28 },
  header: { gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#E5E7EB" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "#6B7280" },
  avatarSection: { alignItems: "center", gap: 20 },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotSelected: {
    transform: [{ scale: 1.2 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  form: { gap: 16 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#9CA3AF", marginLeft: 2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1F2937",
    paddingRight: 14,
  },
  bioWrap: { alignItems: "flex-start", paddingTop: 4 },
  inputFocused: { borderColor: "#00F5D4" },
  inputIcon: { paddingHorizontal: 14, paddingVertical: 14 },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#E5E7EB",
  },
  bioInput: { paddingLeft: 14, minHeight: 80, textAlignVertical: "top" },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#374151" },
  charCountRight: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#374151",
    textAlign: "right",
    marginTop: -4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EF444415",
    borderRadius: 10,
    padding: 12,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#EF4444", flex: 1 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#0A0A0A" },
});
