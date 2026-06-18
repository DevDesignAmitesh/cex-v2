"use client";

import type { Order } from "@repo/common/common";

type OtherDetailsProps = {
  balance: {
    amount: number;
    qty: number;
  };
  trades: Order[];
};

export default function OtherDetails({ balance, trades }: OtherDetailsProps) {
  const latestTrades = trades.slice(-4).reverse();

  return (
    <section className="bg-[#14151B] rounded-md px-4 py-3 min-h-36">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full text-sm">
        <div>
          <p className="text-xs text-gray-400 mb-3">Balances</p>
          <div className="flex justify-between text-neutral-200">
            <span>Equity</span>
            <span>{balance.amount}</span>
          </div>
          <div className="flex justify-between text-neutral-200 mt-2">
            <span>Qty</span>
            <span>{balance.qty}</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-3">Recent Fills</p>
          <div className="text-neutral-500">No fills yet</div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-3">Recent Orders</p>
          {latestTrades.length > 0 ? (
            <div className="space-y-1">
              {latestTrades.map((trade, idx) => (
                <div
                  key={`${trade.id}-${idx}`}
                  className="flex justify-between text-neutral-200"
                >
                  <span
                    className={
                      trade.side === "SELL" ? "text-red-400" : "text-green-400"
                    }
                  >
                    {trade.side}
                  </span>
                  <span>{trade.qty}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-neutral-500">No orders yet</div>
          )}
        </div>
      </div>
    </section>
  );
}
