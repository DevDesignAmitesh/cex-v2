import { TradePage } from "@/pages/tradepage";

export default async function trade({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const symbol = (await params).symbol;
  
  return <TradePage symbol={symbol} />
}
