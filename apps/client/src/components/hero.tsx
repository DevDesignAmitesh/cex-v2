import Image from "next/image";
import WaitListEmail from "./waillistemail";
import Button from "./button";

export default function Hero() {
  return <div className="w-full relative overflow-hidden px-4 pt-28 pb-12 sm:pt-36 lg:pb-20">
    {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(227,62,63,0.14),transparent_28%)]" /> */}
    <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-center items-center">
      {/* <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Spot markets, wallet flows, and account controls in one place
      </div> */}

      <h1 className="max-w-4xl text-center text-4xl font-bold leading-[1.2] text-neutral-100 sm:text-5xl lg:text-6xl">
        Trade with a <span className="bg-[#E33E3F] p-2 rounded-md">sharper</span> view of every market.
      </h1>

      <p className="mt-6 max-w-xl text-center text-xs md:leading-7 leading-3 text-gray-400 sm:text-sm">
        A clean exchange interface for fast execution, transparent balances, and market data that stays close to the trade.
      </p>

      {/* <WaitListEmail /> */}
      <div className="mt-8">
        <Button isLink href="/trade/INR-AXIS" label="Get Started" type="primary" />
      </div>

      <div className="relative mt-8 w-full max-w-5xl">
        {/* <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-blue-500/30 via-white/5 to-red-500/30 blur-2xl" /> */}
        <Image 
          src={"/hero.png"}
          alt="Dark trading terminal interface preview"
          width={1536}
          height={1024}
          className="relative w-full rounded-2xl border border-white/10 object-cover shadow-2xl"
          unoptimized
        />
      </div>
    </div>
  </div>
}
