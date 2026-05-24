import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0A0A" },
        animation: "fade",
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="phone" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="otp" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="email-login" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profile-setup" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
