import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { VeilCard } from "@/components/ui/VeilCard";
import { useAuthStore } from "@/store/authStore";
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
  isLast?: boolean;
}

function SettingRow({ icon, label, value, toggle, toggleValue, onToggle, danger, onPress, isLast }: RowProps) {
  const colors = useColors();
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed && onPress ? 0.7 : 1 }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: danger ? colors.destructive + "22" : colors.secondary }]}>
          <Ionicons name={icon as any} size={17} color={danger ? colors.destructive : colors.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground, fontFamily: "Inter_400Regular", flex: 1 }]}>
          {label}
        </Text>
        {value && <Text style={[styles.rowValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{value}</Text>}
        {toggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={toggleValue ? colors.primary : colors.mutedForeground}
          />
        )}
        {!toggle && onPress && <Ionicons name="chevron-forward" size={15} color={colors.mutedForeground} />}
      </Pressable>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 62 }]} />}
    </>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [notifs, setNotifs] = React.useState(true);
  const [preview, setPreview] = React.useState(true);
  const [readReceipts, setReadReceipts] = React.useState(true);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

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
        <VeilCard style={styles.profileCard} padding={16}>
          <Avatar name={user.name} color={user.avatarColor} size={56} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {user.name}
            </Text>
            <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {user.bio || user.phone}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </VeilCard>
      )}

      {[
        {
          title: "Notifications",
          rows: [
            { icon: "notifications-outline", label: "Push notifications", toggle: true, toggleValue: notifs, onToggle: setNotifs },
            { icon: "eye-outline", label: "Message preview", toggle: true, toggleValue: preview, onToggle: setPreview },
          ],
        },
        {
          title: "Privacy",
          rows: [
            { icon: "lock-closed-outline", label: "Last seen", value: "Everyone", onPress: () => {} },
            { icon: "image-outline", label: "Profile photo", value: "Contacts", onPress: () => {} },
            { icon: "checkmark-done-outline", label: "Read receipts", toggle: true, toggleValue: readReceipts, onToggle: setReadReceipts },
          ],
        },
        {
          title: "Appearance",
          rows: [
            { icon: "phone-portrait-outline", label: "Theme", value: "Dark", onPress: () => {} },
            { icon: "text-outline", label: "Chat font size", value: "Medium", onPress: () => {} },
          ],
        },
        {
          title: "Connected Devices",
          rows: [
            { icon: "laptop-outline", label: "Linked devices", value: "0 devices", onPress: () => {} },
          ],
        },
        {
          title: "Account",
          rows: [
            { icon: "information-circle-outline", label: "App version", value: "1.0.0" },
            { icon: "log-out-outline", label: "Log out", danger: true, onPress: handleLogout },
          ],
        },
      ].map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            {section.title}
          </Text>
          <VeilCard padding={0}>
            {section.rows.map((row, i) => (
              <SettingRow
                key={row.label}
                {...row}
                isLast={i === section.rows.length - 1}
              />
            ))}
          </VeilCard>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28 },
  profileCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 24, gap: 14 },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 16 },
  profileSub: { fontSize: 13 },
  section: { marginBottom: 24, paddingHorizontal: 20, gap: 8 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginLeft: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  iconWrap: { width: 30, height: 30, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth },
});
