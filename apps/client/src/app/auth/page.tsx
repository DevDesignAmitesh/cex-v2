"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { HTTP_URL } from "@/utils";
import Logo from "@/components/logo";

type mode = "signin" | "signup"

export default function Home() {
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
      alert(res.data.message)
      return;
    }
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

    alert(res.data.message);
  }

  const handleAuth = () => {
    if (mode === "signup") {
      signup()
      signin()
    } else {
      signin()
    }
  }
  
  return (
    <div className="w-full h-screen flex justify-center items-center bg-[#0E0F14]">
      <div className="p-5 rounded-md bg-[#14151B] flex flex-col justify-center items-center">
        <Logo />
        <h1 
          className="text-xl my-8 capitalize font-semibold text-neutral-100 text-center">
          {mode === "signin" ? "sign in" : "sign up"}
        </h1>
        
        <input 
          type="text" 
          className="bg-[#202127] w-xs p-3 rounded-xl text-neutral-100 placeholder:text-neutral-500 text-sm outline-none" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Enter email" 
        />
        <input 
          type="text" 
          className="bg-[#202127] w-xs mt-4 p-3 rounded-xl text-neutral-100 placeholder:text-neutral-500 text-sm outline-none" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter password" 
        />

        <button 
          onClick={handleAuth} 
          className="bg-neutral-50 text-sm font-semibold capitalize mt-8 w-xs text-neutral-800 p-2 rounded-md">
            {mode === "signin" ? "sign in" : "sign up"}
        </button>

        <p 
          className="mt-6 cursor-pointer capitalize text-xs text-blue-400 font-medium" onClick={toggleMode}>
            {mode === "signup" ? "already have an account? signin." : "create account"}
        </p>
      </div>
    </div>
  );
}
