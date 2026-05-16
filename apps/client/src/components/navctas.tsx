import Button from "./button";

export default function NavCtas() {
  return <div className="flex justify-center items-center gap-4">
    <Button type="secondary" label="Log in" isLink href="/auth" />
    <Button type="primary" label="Sign up" isLink href="/auth" />
  </div>
}