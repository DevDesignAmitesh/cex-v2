"use client";

import Header from "@/components/header";
import { useAuth } from "@/context/auth";
import Auth from "@/pages/authpage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function auth() {
  const context = useAuth();

  if (!context) {
    return null
  }
  
  const { isLoggedIn } = context
  
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoggedIn) return;
    router.push("/trade/INR-AXIS")
  }, [isLoggedIn])
  
  return <>
    <Header />
    <Auth />
  </>
}