"use client";

import { useAuth } from "@/context/auth";
import Button from "./button";

export default function WaitListEmail() {
  const context = useAuth();

  if (!context) {
    return null
  }
  
  const { isLoggedIn } = context  
  
  return <div className="w-lg bg-[#14151B] rounded-md py-2 px-4 mt-6 flex items-center justify-between">
    <input 
      type="email" 
      placeholder="Email" 
      className="bg-transparent w-fit outline-none h-full 
      placeholder:text-neutral-500 text-neutral-50 text-sm" 
    />

    { isLoggedIn ? (
        <Button type="primary" label="Dashboard" isLink href="/auth" />
      ) : (
        <Button type="primary" label="Sign up" isLink href="/auth" />
      ) 
    }
  </div>
}