import { showcaseScreen1 } from "@/utils";
import Image from "next/image";

export default function ShowcaseScreen1() {
  return <div className="w-full flex flex-col-reverse items-center justify-evenly gap-10 mt-20 lg:flex-row">
    <div className="flex max-w-md flex-col gap-3 lg:mt-10">
      {showcaseScreen1.map((item, idx) => (
        <div key={idx} className="flex items-center gap-4">
          <div className="shrink-0 p-2 rounded-full bg-[#152A3A]">
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 12 12" 
              fill="none" 
              className="text-avatar-text-6">
                <path 
                  d="M2 6L5 9L10 3" 
                  stroke="#5596F6" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg> 
          </div>

          <p className="text-neutral-100 text-sm">{item.content}</p>
      </div>
      ))}
      <p className="text-left text-gray-400 text-sm leading-6 mt-4">
        Built for active users: quick account checks, funding visibility, and a direct path back to the market.
      </p>
    </div>

    <div className="relative w-full max-w-sm">
      <div className="absolute inset-8 rounded-full bg-blue-500/20 blur-3xl" />
      <Image 
      src={"/wallet-exchange-showcase.png"}
      alt="Wallet and exchange mobile app preview"
      width={1024}
      height={1536}
      className="relative w-full object-center object-cover rounded-2xl border border-white/10 shadow-2xl"
      unoptimized
      />
    </div>
    
  </div>
}
