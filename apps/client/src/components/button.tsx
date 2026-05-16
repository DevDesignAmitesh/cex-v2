"use client";

import Link from "next/link";

type ButtonProps = {
  type: "primary" | "secondary",
  label: string;
  isLink?: boolean
  href?: string
  onClick?: () => void;
}

export default function Button({ isLink, label, type, href, onClick }: ButtonProps) {
  const commonClassName = `
  px-4 py-2 rounded-md text-sm hover:opacity-90
    
  ${
    type === "secondary" 
    ? "bg-neutral-800 text-neutral-100" 
    : "bg-neutral-100 text-neutral-900"
  }
  
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