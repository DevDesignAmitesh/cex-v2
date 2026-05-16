import { navItems } from "@/utils";
import Link from "next/link";

export default function NavItems() {
  return <div className="flex justify-center items-center gap-6">
    {navItems.map((item) => (
      <Link href={item.href} className="capitalize text-neutral-400 text-sm hover:opacity-90">
        {item.label}
      </Link>
    ))}
  </div>
}