import Logo from "./logo";
import NavCtas from "./navctas";
import NavItems from "./navitems";

export default function Header() {
  return <header className="w-full fixed z-10 top-0 border-b border-white/5 bg-[#0E0F14]/85 px-4 py-4 backdrop-blur-xl">
    <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
      <Logo />
      <div className="hidden md:block">
        <NavItems />
      </div>
      <NavCtas /> 
    </div>
  </header>
}
