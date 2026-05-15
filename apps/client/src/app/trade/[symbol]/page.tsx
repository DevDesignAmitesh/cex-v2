export default async function trade({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {

  const symbol = (await params).symbol

  return (
    <div className="bg-neutral-950 w-full h-screen flex">
      <div className="w-full h-full">heloooo</div>
      <div className="w-full h-full"></div>
    </div>
  )
}