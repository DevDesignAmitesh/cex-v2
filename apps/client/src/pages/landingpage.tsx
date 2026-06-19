"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import ShowCase from "@/components/showcase";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Landing() {
  const context = useAuth();

  if (!context) {
    return null
  }
  
  const { isLoggedIn } = context;
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoggedIn) return;
    router.push("/trade/INR-AXIS")
  }, [isLoggedIn])
  
  return <div className="relative w-full h-auto">
    <div className="w-full bg-[#0E0F14] h-auto">
      <Header />
      <Hero />
    </div>
    <ShowCase />
    <Footer />
  </div>
}