import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { VeilButton } from "@/components/ui/VeilButton";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const AVATAR_COLORS = ["#00F5D4","#7C3AED","#F59E0B","#EF4444","#3B82F6","#10B981","#EC4899"];

export default function ProfileSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setupProfile } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarColor] = useState(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await setupProfile(name.trim(), bio.trim());
    setLoading(false);
    router.replace("/(tabs)/chats");
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#00F5D411", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kav}>
        <View style={[styles.inner, { paddingTop: topPad + 40, paddingBottom: botPad + 32, paddingHorizontal: 28 }]}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Set up your profile
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Your name is visible to your contacts
            </Text>
            <View style={styles.avatarWrap}>
              <Avatar name={name || "VC"} color={avatarColor} size={80} />
            </View>
            <View style={styles.fields}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: name ? colors.primary + "66" : colors.border, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
              />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Bio (optional)"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
                maxLength={120}
              />
            </View>
          </View>
          <VeilButton label="Get Started" onPress={handleSave} loading={loading} disabled={!name.trim()} fullWidth />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  inner: { flex: 1 },
  content: { flex: 1, justifyContent: "center", gap: 14, marginBottom: 32 },
  title: { fontSize: 26 },
  sub: { fontSize: 15 },
  avatarWrap: { alignItems: "center", marginVertical: 20 },
  fields: { gap: 12 },
  input: { height: 52, paddingHorizontal: 16, fontSize: 15, borderWidth: 1 },
});
