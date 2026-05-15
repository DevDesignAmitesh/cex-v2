"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { HTTP_URL } from "@/utils";

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
    <div className="w-full h-screen flex flex-col justify-center items-center bg-neutral-950">
      <input type="text" className="bg-transparent border border-neutral-600 w-xs p-2 rounded-md text-neutral-100" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
      <input type="text" className="bg-transparent border border-neutral-600 w-xs mt-4 p-2 rounded-md text-neutral-100" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />

      <button onClick={handleAuth} className="bg-neutral-200 mt-8 w-xs text-neutral-800 p-2 rounded-md">{mode === "signin" ? "signin" : "signup"}</button>

      <p className="mt-3 cursor-pointer text-neutral-100" onClick={toggleMode}>{mode === "signup" ? "already have an account? signin." : "create account"}</p>
    </div>
  );
}
