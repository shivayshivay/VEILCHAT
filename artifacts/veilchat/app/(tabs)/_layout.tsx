import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  return <Ionicons name={focused ? name : (name + "-outline") as IconName} size={24} color={color} />;
}

export default function TabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 80,
          paddingBottom: isWeb ? 34 : Platform.OS === "android" ? 10 : 20,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => <TabIcon name="chatbubble-ellipses" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: "Status",
          tabBarIcon: ({ color, focused }) => <TabIcon name="radio" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: "Calls",
          tabBarIcon: ({ color, focused }) => <TabIcon name="call" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, focused }) => <TabIcon name="people" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => <TabIcon name="settings" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
