"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import ShowCase from "@/components/showcase";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";

export default function Landing() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  
  if (isLoggedIn) {
    router.push("/trade/INR-AXIS")
    return;
  }
  
  return <div className="relative w-full h-auto">
    <div className="w-full bg-[#0E0F14] h-auto">
      <Header />
      <Hero />
    </div>
    <ShowCase />
    <Footer />
  </div>
}