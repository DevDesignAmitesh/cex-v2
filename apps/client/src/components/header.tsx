import Logo from "./logo";
import NavCtas from "./navctas";
import NavItems from "./navitems";

export default function Header() {
  return <header className="w-full fixed z-1 top-0 p-3 bg-[#0E0F14]">
    <div className="w-full max-w-7xl mx-auto flex justify-between items-center bg-[#0E0F14]">
      <Logo />
      <NavItems />
      <NavCtas /> 
    </div>
  </header>
}