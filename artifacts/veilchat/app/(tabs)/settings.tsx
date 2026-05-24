import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  onPress?: () => void;
}

function SettingRow({ icon, label, value, toggle, toggleValue, onToggle, danger, onPress }: RowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed && onPress ? 0.75 : 1 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: danger ? colors.destructive + "22" : colors.secondary }]}>
        <Ionicons name={icon as any} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground, fontFamily: "Inter_400Regular", flex: 1 }]}>
        {label}
      </Text>
      {value && (
        <Text style={[styles.rowValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{value}</Text>
      )}
      {toggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary + "80" }}
          thumbColor={toggleValue ? colors.primary : colors.mutedForeground}
        />
      )}
      {!toggle && onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
        {title}
      </Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = React.useState(true);
  const [preview, setPreview] = React.useState(true);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 34) + 60 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Settings</Text>
      </View>

      {user && (
        <Pressable style={[styles.profileCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Avatar name={user.name} color={user.avatarColor} size={60} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {user.name}
            </Text>
            <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {user.bio || user.phone}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
      )}

      <Section title="Notifications">
        <SettingRow icon="notifications-outline" label="Push notifications" toggle toggleValue={notifs} onToggle={setNotifs} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow icon="eye-outline" label="Message preview" toggle toggleValue={preview} onToggle={setPreview} />
      </Section>

      <Section title="Privacy">
        <SettingRow icon="lock-closed-outline" label="Last seen" value="Everyone" onPress={() => {}} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow icon="image-outline" label="Profile photo" value="Contacts" onPress={() => {}} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow icon="checkmark-done-outline" label="Read receipts" toggle toggleValue={true} onToggle={() => {}} />
      </Section>

      <Section title="Appearance">
        <SettingRow icon="phone-portrait-outline" label="Theme" value="Dark" onPress={() => {}} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow icon="text-outline" label="Chat font size" value="Medium" onPress={() => {}} />
      </Section>

      <Section title="Connected Devices">
        <SettingRow icon="laptop-outline" label="Linked devices" value="0 devices" onPress={() => {}} />
      </Section>

      <Section title="Account">
        <SettingRow icon="information-circle-outline" label="App version" value="1.0.0" />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow icon="log-out-outline" label="Log out" danger onPress={logout} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28 },
  profileCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 24, padding: 16, gap: 14 },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 17 },
  profileSub: { fontSize: 14 },
  section: { marginBottom: 24, paddingHorizontal: 20, gap: 8 },
  sectionTitle: { fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginLeft: 4 },
  sectionCard: { overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
});
