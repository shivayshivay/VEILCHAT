import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ContactCard } from "@/components/contacts/ContactCard";
import { VeilInput } from "@/components/ui/VeilInput";
import { useChatStore } from "@/store/chatStore";
import { useColors } from "@/hooks/useColors";
import { useDebounce } from "@/hooks/useDebounce";
import { Contact } from "@/types/chat";

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { searchContacts } = useChatStore();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);

  const results = searchContacts(debouncedQuery);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const grouped: Record<string, Contact[]> = {};
  results.forEach((c) => {
    const letter = c.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });
  const sections = Object.keys(grouped).sort().map((key) => ({ letter: key, contacts: grouped[key] }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Contacts</Text>
          <Pressable style={styles.headerBtn}>
            <Ionicons name="person-add-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
        <VeilInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search contacts"
          leftIcon="search-outline"
          rightIcon={query.length > 0 ? "close-circle" : undefined}
          onRightIconPress={() => setQuery("")}
        />
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.letter}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: section }) => (
          <View>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionLetter, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {section.letter}
              </Text>
            </View>
            {section.contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onPress={() => router.push(`/chat/${contact.id}`)}
                onCall={() => {}}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No contacts found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28 },
  headerBtn: { padding: 6 },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionLetter: { fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
