import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View } from "react-native";

export default function RootIndex() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} />;
  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
