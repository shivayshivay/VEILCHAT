import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "@/store/authStore";

export default function RootIndex() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) return <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} />;
  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/splash" />;
}
