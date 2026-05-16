import Button from "./button";
import ShowcaseScreen1 from "./showcase-screen1";
import ShowcaseScreen2 from "./showcase-screen2";

export default function ShowCase() {
  return <div className="min-h-screen w-full bg-[#10121A] pb-10">
    <div className="w-full h-full max-w-7xl mx-auto flex flex-col justify-center items-center">
      <p className="text-base uppercase text-blue-400 text-center mt-32">Backpack Wallet</p>

      <h1 className="text-5xl text-center font-semibold text-neutral-50 mt-6">Your 
       {" "}<span className="text-blue-400">wallet</span> {" "}
         and 
        {" "}<span className="text-[#E33E3F]">exchange</span>
         , in one place.</h1>

      <p className="w-lg text-center text-gray-400 text-xl mt-8">
        Self-custody across 10+ networks, and a direct connection to Backpack Exchange when you need it.
      </p>

      <ShowcaseScreen1 />
      <ShowcaseScreen2 />
      
      <div className="flex flex-col justify-center items-center gap-6 py-32">
      <h1 className="text-5xl text-center font-semibold text-neutral-50 mt-6">Modern finance starts 
        {" "}<span className="text-[#E33E3F]">here</span>.</h1>

        <Button type="primary" label="Sign up for free" isLink href="/auth" />

      </div>
    </div>
  </div>
}