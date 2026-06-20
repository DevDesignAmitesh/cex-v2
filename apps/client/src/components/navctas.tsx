import { useAuth } from "@/context/auth";
import Button from "./button";

export default function NavCtas() {
  const context = useAuth();
  if (!context) {
    return null
  }
  
  const { isLoggedIn } = context;

  return <div className="flex justify-center items-center gap-2 sm:gap-4">
    {isLoggedIn ? (
      <Button type="primary" label="Markets" isLink href="/trade/INR-AXIS" />
    ) : (
      <>
        <Button type="secondary" label="Register" isLink href="/auth" className="hidden sm:inline-flex" />
        <Button type="primary" label="Markets" isLink href="/trade/INR-AXIS" />
      </>
    )}
  </div>
}
