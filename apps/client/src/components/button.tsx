"use client";

import Link from "next/link";

type ButtonProps = {
  type: "primary" | "secondary",
  label: string;
  isLink?: boolean
  href?: string
  onClick?: () => void;
  className?: string;
}

export default function Button({ isLink, label, type, href, onClick, className = "" }: ButtonProps) {
  const commonClassName = `
  inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold transition hover:opacity-90
    
  ${
    type === "secondary" 
    ? "bg-white/10 text-neutral-100 border border-white/10" 
    : "bg-neutral-100 text-neutral-900"
  } 
  ${className}
  `
  
  if (isLink) {
    return <Link className={commonClassName} href={href ?? ""}>
      {label}
    </Link>
  }

  return <button onClick={onClick} className={commonClassName}>
    {label}
  </button>
}
