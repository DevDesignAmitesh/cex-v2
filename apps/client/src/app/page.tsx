import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full h-screen flex justify-center items-center bg-neutral-900 text-white">
      <Link href={"/auth"} >click for auth page</Link>
    </div>
  );
}
