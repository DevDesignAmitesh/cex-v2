import { footer1 } from "@/utils";
import Logo from "./logo";

export default function Footer() {
  return <footer className="bg-[#14151B] w-full">
    <div className="w-full max-w-7xl mx-auto p-10 grid grid-cols-6 items-start place-content-center place-items-center">
      <Logo />
      {Array.from({length: 5}).map((_, idx) => (
        <div key={idx} className="flex flex-col gap-2 text-xs text-[#969FAF] capitalize">
          {footer1.map((item) => (
            <p 
              className={`
                hover:opacity-90 cursor-pointer 
                ${item.isHeading && "text-neutral-100 text-sm"}
              `}>
              {item.content}
            </p>
          )
          )} 
      </div>
      ) )}
    </div>
  </footer>
}