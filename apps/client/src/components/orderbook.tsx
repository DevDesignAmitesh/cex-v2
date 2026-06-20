"use client";

import type { ClientOrderBook, Order, orderSide } from "@repo/common/common";

type OrderBookView = "BOOK" | "TRADES";

type OrderBookProps = {
  orderBook: ClientOrderBook;
  orderbookType: OrderBookView;
  trades: Order[];
  lastTradedPriceSide: orderSide | null;
  onOrderbookTypeChange: (type: OrderBookView) => void;
};

function getDepthWidth(qty: number, maxQty: number) {
  if (maxQty <= 0) return 0;
  return (qty / maxQty) * 100;
}

export default function OrderBook({
  orderBook,
  orderbookType,
  trades,
  lastTradedPriceSide,
  onOrderbookTypeChange,
}: OrderBookProps) {
  const maxAskQty = Math.max(0, ...orderBook.asks.map((ask) => ask.qty));
  const maxBidQty = Math.max(0, ...orderBook.bids.map((bid) => bid.qty));

  return (
    <section className="flex w-full flex-col rounded-xl border border-white/10 bg-[#14151B] px-2 py-4 lg:w-72 lg:shrink-0">
      <div className="w-full flex items-center mt-1 h-8 text-sm">
        <button
          onClick={() => onOrderbookTypeChange("BOOK")}
          className={`px-4 py-2 flex items-center font-medium text-sm justify-center rounded-md cursor-pointer ${
            orderbookType === "BOOK"
              ? "bg-[#1F2026] text-neutral-200"
              : "text-neutral-200"
          }`}
        >
          Book
        </button>
        <button
          onClick={() => onOrderbookTypeChange("TRADES")}
          className={`px-4 py-2 flex items-center font-medium text-sm justify-center rounded-md text-neutral-200 cursor-pointer ${
            orderbookType === "TRADES"
              ? "bg-[#1F2026] text-neutral-200"
              : "text-neutral-200"
          }`}
        >
          Trades
        </button>
      </div>

      <div className="mt-4" />

      <div className="w-full">
        <div className="flex justify-between px-4 py-2 items-center text-xs text-neutral-300 bg-[#1F2026]">
          <p>Price</p>
          <p>Quantity</p>
        </div>

        <div className="mt-4" />

        {orderbookType === "BOOK" ? (
          <div className="h-96 w-full overflow-y-auto scrollbar-thin scrollbar-thumb-black/40 lg:h-115">
            <div className="flex flex-col">
              {orderBook.asks
                .slice()
                .reverse()
                .map((ask, idx) => (
                  <div
                    key={`${ask.price}-${idx}`}
                    className="relative grid grid-cols-2 px-4 py-0.75 overflow-hidden"
                  >
                    <div
                      className="absolute right-0 top-0 h-full bg-red-500/15"
                      style={{
                        width: `${getDepthWidth(ask.qty, maxAskQty)}%`,
                      }}
                    />

                    <p className="relative z-10 text-red-400">
                      {ask.price.toFixed(2)}
                    </p>

                    <p className="relative z-10 text-right text-gray-300">
                      {ask.qty.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-3 border-y border-white/5">
              <p
                className={`text-2xl font-semibold ${
                  lastTradedPriceSide === null
                    ? "text-gray-500"
                    : lastTradedPriceSide === "SELL"
                      ? "text-red-500"
                      : "text-green-500"
                }`}
              >
                {orderBook.lastTradedPrice.toFixed(2)}
              </p>
            </div>

            <div className="flex flex-col">
              {orderBook.bids
                .slice()
                .reverse()
                .map((bid, idx) => (
                  <div
                    key={`${bid.price}-${idx}`}
                    className="relative grid grid-cols-2 px-4 py-0.75 overflow-hidden"
                  >
                    <div
                      className="absolute right-0 top-0 h-full bg-green-500/15"
                      style={{
                        width: `${getDepthWidth(bid.qty, maxBidQty)}%`,
                      }}
                    />

                    <p className="relative z-10 text-green-400">
                      {bid.price.toFixed(2)}
                    </p>

                    <p className="relative z-10 text-right text-gray-300">
                      {bid.qty.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="h-96 w-full overflow-y-auto scrollbar-thin scrollbar-thumb-black/40 lg:h-115">
            <div className="flex flex-col">
              {trades
                .slice()
                .reverse()
                .map((trade, idx) => (
                <div
                  key={`${trade.id}-${idx}`}
                  className="relative grid grid-cols-2 px-4 py-0.75 overflow-hidden"
                >
                  <p
                    className={`relative z-10 ${trade.side === "SELL" ? "text-red-400" : "text-green-400"}`}
                  >
                    {trade.price}
                  </p>

                  <p className="relative z-10 text-right text-gray-300">
                    {trade.qty}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
