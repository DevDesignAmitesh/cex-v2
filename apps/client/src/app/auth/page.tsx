"use client";

import Header from "@/components/header";
import { useAuth } from "@/context/auth";
import Auth from "@/pages/authpage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthRoute() {
  const context = useAuth();
  const router = useRouter();
  const isLoggedIn = context?.isLoggedIn ?? false;
  
  useEffect(() => {
    if (!isLoggedIn) return;
    router.push("/trade/INR-AXIS")
  }, [isLoggedIn, router])

  if (!context) {
    return null
  }
  
  return <>
    {/* <Header /> */}
    <Auth />
  </>
}
