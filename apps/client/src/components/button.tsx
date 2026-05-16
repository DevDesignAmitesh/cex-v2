"use client";

import Link from "next/link";

type ButtonProps = {
  type: "primary" | "secondary",
  label: string;
  isLink?: boolean
  href?: string
}

export default function Button({ isLink, label, type, href }: ButtonProps) {
  const className = `px-4 py-2 rounded-md text-sm hover:opacity-90

  ${
      type === "secondary" 
      ? "bg-neutral-800 text-neutral-100" 
      : "bg-neutral-100 text-neutral-900"
  }`
  
  if (isLink) {
    return <Link className={className} href={href ?? ""}>
      {label}
    </Link>
  }

  return <button className={className}>
    {label}
  </button>
}