"use client";

import { usePathname } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type AuthContextProps = {
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextProps | null>(null);

export function AuthContextProvider ({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const pathName = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (token) setIsLoggedIn(true);
    else setIsLoggedIn(false)
  }, [pathName])
  
  return (
    <AuthContext.Provider value={{ isLoggedIn }}>
     {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext not initialized");

  return context;
}
