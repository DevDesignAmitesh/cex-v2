import Header from "@/components/header";
import Hero from "@/components/hero";
import ShowCase from "@/components/showcase";

export default function Landing() {
  return <div className="relative w-full h-auto">
    <div className="w-full bg-[#0E0F14] h-auto">
      <Header />
      <Hero />
    </div>
    <ShowCase />
  </div>
}