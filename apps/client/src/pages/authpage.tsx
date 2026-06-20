"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { HTTP_URL } from "@/utils";
import Logo from "@/components/logo";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

type mode = "signin" | "signup"

export default function Auth() {
  const [mode, setMode] = useState<mode>("signup");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  const router = useRouter();
  
  const toggleMode = () => {
    setMode(p => p === "signin" ? "signup" : "signin")
  };

  const signup = async () => {
    const res = await axios.post(`${HTTP_URL}/signup`, { email, password }, 
      { validateStatus: () => true }
    );

    if (res.status > 201) {
      toast.error(res.data.message)
      return false
    }
    return true
  }

  const signin = async () => {
    const res = await axios.post(`${HTTP_URL}/signin`, { email, password }, 
      { validateStatus: () => true }
    );

    if (res.status <= 201) {
      localStorage.setItem("token", res.data.token)
      router.push("/trade/INR-AXIS")
      return;
    } 

    toast.error(res.data.message);
  }

  const handleAuth = async () => {
    if (mode === "signup") {
      const res = await signup()
      if (res) signin()
      else return;
    } else {
      signin()
    }
  }
  
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0E0F14] px-4 py-10">
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_85%_85%,rgba(227,62,63,0.16),transparent_28%)]" /> */}
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#14151B]/90 shadow-2xl backdrop-blur md:grid-cols-[1fr_1fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden md:block">
          <Image
            src="/wallet-exchange-showcase.png"
            alt="Wallet and trading app preview"
            fill
            className="object-contain object-left"
            unoptimized
          />
          {/* <div className="absolute inset-0 bg-gradient-to-t from-[#14151B] via-[#14151B]/15 to-transparent" /> */}
          <div className="absolute bottom-0 p-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-300">
              Secure access
            </p>
            <h2 className="mt-3 max-w-sm text-3xl font-semibold text-white">
              Enter the exchange with balances and markets ready.
            </h2>
          </div>
        </div>

        <div className="flex flex-col justify-center px-5 py-8 sm:px-10">
          <Logo />
          <p className="mt-10 text-sm uppercase tracking-[0.18em] text-blue-300">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold capitalize text-neutral-100">
            {mode === "signin" ? "Sign in" : "Sign up"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Use your account to deposit funds, manage balances, and place orders from the trading desk.
          </p>
        
          <input 
            type="email" 
            className="mt-8 w-full rounded-xl border border-white/10 bg-[#202127] p-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-blue-400/60 focus:bg-[#24252d]" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Enter email" 
          />
          <input 
            type="password" 
            className="mt-4 w-full rounded-xl border border-white/10 bg-[#202127] p-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-blue-400/60 focus:bg-[#24252d]" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter password" 
          />

          <button 
            onClick={handleAuth} 
            className="mt-8 w-full rounded-xl bg-neutral-50 p-3 text-sm font-semibold capitalize text-neutral-900 transition hover:bg-white">
              {mode === "signin" ? "sign in" : "sign up"}
          </button>

          <Link
            href={""}
            className="mt-6 cursor-pointer text-center text-xs font-medium capitalize text-blue-400" onClick={toggleMode}>
              {mode === "signup" ? "already have an account? signin." : "create account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
