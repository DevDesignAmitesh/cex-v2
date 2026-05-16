import Image from "next/image";
import WaitListEmail from "./waillistemail";

export default function Hero() {
  return <div className="w-full relative h-full pt-32 pb-10">
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center items-center">
      <h1 className="text-7xl tracking-tighter text-neutral-100 text-center font-bold">Modern 
        {" "}<span className="text-red-500">finance</span>.
      </h1>

      <p className="w-lg text-center text-gray-400 text-xl mt-8">
        Your brokerage, your exchange, your money. Trade, borrow, spend, and earn in the most powerful margin account in finance.
      </p>

      <WaitListEmail />

      <div className="w-full max-w-4xl mx-auto mt-10">
        <Image 
          src={"/hero.png"}
          alt="hero"
          width={100}
          height={100}
          className="w-full object-center object-cover"
          unoptimized
        />
      </div>
    </div>
  </div>
}