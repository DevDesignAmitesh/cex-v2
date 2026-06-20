import { showcaseScreen1 } from "@/utils";
import Image from "next/image";

export default function ShowcaseScreen2() {
  return <div className="w-full flex flex-col-reverse items-center justify-evenly gap-10 mt-20 lg:flex-row-reverse">
    <div className="flex max-w-md flex-col gap-3 lg:mt-10">
      {showcaseScreen1.map((item, idx) => (
        <div key={idx} className="flex items-center gap-4">
          <div className="shrink-0 p-2 rounded-full bg-[#152A3A]">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="text-avatar-text-6"><path d="M2 6L5 9L10 3" stroke="#5596F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg> 
          </div>

          <p className="text-neutral-100 text-sm">{item.content}</p>
      </div>
      ))}
      <p className="text-left text-gray-400 text-sm leading-6 mt-4">
        The trading surface stays focused: chart, depth, positions, and order controls adapt cleanly from desktop down to mobile.
      </p>
    </div>

    <div className="relative w-full max-w-2xl">
      <div className="absolute inset-x-8 top-10 h-40 rounded-full bg-red-500/10 blur-3xl" />
      <Image 
      src={"/exchange-terminal-hero.png"}
      alt="Exchange terminal dashboard preview"
      width={1536}
      height={1024}
      className="relative w-full object-center object-cover rounded-2xl border border-white/10 shadow-2xl"
      unoptimized
      />
    </div>
    
  </div>
}
