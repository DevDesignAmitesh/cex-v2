import Button from "./button";
import ShowcaseScreen1 from "./showcase-screen1";
import ShowcaseScreen2 from "./showcase-screen2";

export default function ShowCase() {
  return <div className="min-h-screen w-full bg-[#10121A] px-4 pb-10">
    <div className="w-full h-full max-w-7xl mx-auto flex flex-col justify-center items-center">
      <p className="text-sm uppercase tracking-[0.22em] text-blue-400 text-center mt-24 sm:mt-32">Wallet and exchange</p>

      <h1 className="max-w-4xl text-4xl text-center font-semibold text-neutral-50 mt-6 sm:text-5xl">Your 
       {" "}<span className="text-blue-400">wallet</span> {" "}
         and
        {" "}<span className="text-[#E33E3F]">exchange</span>
         , without the context switch.</h1>

      <p className="max-w-2xl text-center text-gray-400 text-base leading-7 mt-8 sm:text-lg">
        Keep balances, order flow, and market movement visible together so funding and trading feel like one workflow.
      </p>

      <ShowcaseScreen1 />
      <ShowcaseScreen2 />
      
      <div className="flex flex-col justify-center items-center gap-6 py-24 sm:py-32">
      <h1 className="text-4xl text-center font-semibold text-neutral-50 mt-6 sm:text-5xl">Modern finance starts 
        {" "}<span className="text-[#E33E3F]">here</span>.</h1>

        <Button type="primary" label="Sign up for free" isLink href="/auth" />

      </div>
    </div>
  </div>
}
