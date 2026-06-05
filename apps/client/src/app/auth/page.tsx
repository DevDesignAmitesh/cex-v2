"use client";

import Header from "@/components/header";
import { useAuth } from "@/context/auth";
import Auth from "@/pages/authpage";
import { useRouter } from "next/navigation";

export default function auth() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  
  if (isLoggedIn) {
    router.push("/trade/INR-AXIS")
    return;
  }

  return <>
    <Header />
    <Auth />
  </>
}