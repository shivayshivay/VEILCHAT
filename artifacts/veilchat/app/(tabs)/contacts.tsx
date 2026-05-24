import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ContactCard } from "@/components/contacts/ContactCard";
import { useChat } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { searchContacts } = useChat();
  const [query, setQuery] = useState("");

  const results = searchContacts(query);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const grouped: Record<string, typeof results> = {};
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
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderRadius: colors.radius }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search contacts"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.letter}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!sections.length}
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
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionLetter: { fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
