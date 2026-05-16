import { showcaseScreen1 } from "@/utils";
import Image from "next/image";

export default function ShowcaseScreen2() {
  return <div className="w-full flex flex-row-reverse justify-evenly mt-20">
    <div className="flex flex-col gap-2 mt-10">
      {showcaseScreen1.map((item) => (
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-[#152A3A]">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" class="text-avatar-text-6"><path d="M2 6L5 9L10 3" stroke="#5596F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg> 
          </div>

          <p className="text-neutral-100 text-sm">{item.content}</p>
      </div>
      ))}
      <p className="w-md text-left text-gray-400 text-sm mt-4">
        Built for power users: multiple accounts, custom RPCs, sidepanel support, and more.
      </p>
    </div>

    <Image 
      src={"/show-case-1.png"}
      alt="hero"
      width={100}
      height={100}
      className="w-64 object-center object-cover rounded-md"
      unoptimized
    />
    
  </div>
}