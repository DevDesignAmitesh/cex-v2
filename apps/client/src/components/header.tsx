import Logo from "./logo";
import NavCtas from "./navctas";
import NavItems from "./navitems";

export default function Header() {
  return <footer className="w-full fixed top-0 px-5 py-3">
    <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
      <Logo />
      <NavItems />
      <NavCtas /> 
    </div>
  </footer>
}