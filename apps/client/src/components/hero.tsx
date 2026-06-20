import Image from "next/image";
import WaitListEmail from "./waillistemail";

export default function Hero() {
  return <div className="w-full relative overflow-hidden px-4 pt-28 pb-12 sm:pt-36 lg:pb-20">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(227,62,63,0.14),transparent_28%)]" />
    <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-center items-center">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Spot markets, wallet flows, and account controls in one place
      </div>

      <h1 className="max-w-5xl text-center text-5xl font-bold leading-[1.02] text-neutral-100 sm:text-6xl lg:text-7xl">
        Trade with a sharper view of every market.
      </h1>

      <p className="mt-6 max-w-2xl text-center text-base leading-7 text-gray-400 sm:text-lg">
        A clean exchange interface for fast execution, transparent balances, and market data that stays close to the trade.
      </p>

      <WaitListEmail />

      <div className="relative mt-12 w-full max-w-6xl">
        <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-blue-500/30 via-white/5 to-red-500/30 blur-2xl" />
        <Image 
          src={"/exchange-terminal-hero.png"}
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
