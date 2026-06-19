"use client";

import { HTTP_URL } from "@/utils";
import { usePathname } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { Profile } from "@repo/common/common";

type AuthContextProps = {
  isLoggedIn: boolean;
  profile: Profile | null;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps | null>(null);

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Boolean(token));
  const [profile, setProfile] = useState<Profile | null>(null);
  const pathName = usePathname();

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setIsLoggedIn(false);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const activeToken = token ?? localStorage.getItem("token");

    if (!activeToken) {
      setIsLoggedIn(false);
      setProfile(null);
      return;
    }

    const res = await axios.get(`${HTTP_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
      validateStatus: () => true,
    });

    console.log("response from getProfile");
    console.log(res.data);

    if (res.status <= 201) {
      setIsLoggedIn(true);
      setProfile(res.data.profile);
    } else {
      setIsLoggedIn(false);
      setProfile(null);
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      setIsLoggedIn(Boolean(storedToken));
      if (!storedToken) setProfile(null);
    });
  }, [pathName]);

  useEffect(() => {
    if (!token) return;
    queueMicrotask(() => {
      void refreshProfile();
    });
  }, [refreshProfile, token]);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, profile, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext not initialized");

  return context;
};
