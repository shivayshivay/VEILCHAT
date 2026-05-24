import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface VeilUser {
  id: string;
  name: string;
  phone: string;
  bio: string;
  avatarColor: string;
}

interface AuthContextType {
  user: VeilUser | null;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  setupProfile: (name: string, bio: string) => Promise<void>;
  logout: () => Promise<void>;
  pendingPhone: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AVATAR_COLORS = [
  "#00F5D4", "#7C3AED", "#F59E0B", "#EF4444", "#3B82F6", "#10B981",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VeilUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("veilchat_user").then((raw) => {
      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (phone: string) => {
    setPendingPhone(phone);
    await new Promise((r) => setTimeout(r, 800));
  }, []);

  const verifyOtp = useCallback(async (_otp: string) => {
    await new Promise((r) => setTimeout(r, 600));
  }, []);

  const setupProfile = useCallback(
    async (name: string, bio: string) => {
      const newUser: VeilUser = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        name,
        phone: pendingPhone,
        bio,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      };
      await AsyncStorage.setItem("veilchat_user", JSON.stringify(newUser));
      setUser(newUser);
    },
    [pendingPhone]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(["veilchat_user"]);
    setUser(null);
    router.replace("/(auth)/login");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, verifyOtp, setupProfile, logout, pendingPhone }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
