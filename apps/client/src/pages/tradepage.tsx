"use client";

import Button from "@/components/button";
import { useMemo, useState } from "react";
import {
  OrderBookKey,
  orderSide,
  orderType,
  UserBasedOrderBook,
} from "@repo/common/common";

export function TradePage({ symbol }: { symbol: string }) {
  const [side, setSide] = useState<orderSide>("BUY");
  const [type, setType] = useState<orderType>("LIMIT");
  const [orderbookType, setOrderbookType] = useState<"BOOK" | "TRADES">("BOOK");
  const [orderbook, setOrderbook] = useState<UserBasedOrderBook>({
    AXIS: { bids: {}, asks: {}, lastTradedPrice: 0 },
    TATA: { bids: {}, asks: {}, lastTradedPrice: 0 },
  });

  const orderbook_symbol = useMemo(
    () => symbol.split("-")[1]!,
    [symbol],
  ) as OrderBookKey;
  const symbolized_orderbook = useMemo(
    () => orderbook[orderbook_symbol],
    [orderbook_symbol, orderbook],
  );

  return (
    <div className="w-full bg-[#0E0F14] relative">
      <div className="pt-4 text-neutral-100 w-full max-w-7xl mx-auto h-screen flex flex-col overflow-hidden font-mono">
        {/* Top Header Bar */}
        <div className="flex mb-2 items-center gap-6 p-4 bg-[#14151B] shrink-0 rounded-md">
          <p className="font-medium">
            {symbol.split("-")[0]} -{" "}
            <span className="text-gray-400">{symbol.split("-")[1]}</span>
          </p>

          {/* last traded price */}
          <p title="Last traded price" className="text-green-500">
            72,061.6
          </p>
        </div>

        {/* Main 3-Column Layout */}
        <div className="flex flex-1 overflow-hidden gap-2">
          {/* ── Column 1: Chart ── */}
          <div className="flex flex-col flex-1 min-w-0 bg-[#14151B]"></div>

          {/* ── Column 2: Order Book ── */}
          <div className="h-fit flex flex-col w-72 shrink-0 bg-[#14151B] px-2 py-4">
            <div className="w-full flex items-center mt-1 h-8 text-sm">
              <div
                onClick={() => setOrderbookType("BOOK")}
                className={`px-4 py-2 flex items-center font-medium text-sm justify-center rounded-md 
                ${orderbookType === "BOOK" ? "bg-[#1F2026] text-neutral-200" : "text-neutral-200"} cursor-pointer`}
              >
                Book
              </div>
              <div
                onClick={() => setOrderbookType("TRADES")}
                className={`px-4 py-2 flex items-center font-medium text-sm justify-center rounded-md text-neutral-200 
                ${orderbookType === "TRADES" ? "bg-[#1F2026] text-neutral-200" : "text-neutral-200"}
                cursor-pointer`}
              >
                Trades
              </div>
            </div>

            <div className="mt-4" />

{/* ADD SAME THINGS FOR THE TRADES THINGYY */}
            <div className="w-full">
              <div
                className="flex justify-between px-4 py-2 items-center text-xs 
                text-neutral-300 bg-[#1F2026]"
              >
                <p>Price</p>
                <p>Quantity</p>
              </div>

              <div className="mt-4" />

              <div className="overflow-y-auto w-full h-115 scrollbar-thin scrollbar-thumb-black/40">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between px-4 py-2 items-center text-xs 
                    text-red-600 bg-red-900/20"
                  >
                    <p>79.83</p>
                    <p>220.00</p>
                  </div>
                ))}

                {/* last traded price */}
                <p
                  title="Last traded price"
                  className="text-green-500 py-2 pl-1"
                >
                  72,061.6
                </p>

                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between px-4 py-2 items-center text-xs 
                    text-green-600 bg-green-900/20"
                  >
                    <p>79.83</p>
                    <p>220.00</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Column 3: Order Placement ── */}
          <div className="h-fit flex gap-2 flex-col w-64 shrink-0 bg-[#14151B] px-2 py-4 rounded-md">
            {/* if not active then bg-[#14151B] else gree and red thing */}
            {/* buy or sell */}
            <div className="w-full flex items-center gap-2 h-12 text-sm bg-[#14151B]">
              <div
                onClick={() => setSide("BUY")}
                className={`w-full h-full flex items-center font-semibold justify-center rounded-md 
                ${side === "BUY" ? "bg-[#122322] text-green-500" : "bg-[#14151B] text-neutral-200"} cursor-pointer`}
              >
                Buy / Long
              </div>
              <div
                onClick={() => setSide("SELL")}
                className={`w-full h-full flex items-center font-semibold justify-center rounded-md 
                ${side === "SELL" ? "bg-[#351A1F] text-red-500" : "bg-[#14151B] text-neutral-200"} cursor-pointer`}
              >
                Sell / Short
              </div>
            </div>

            {/* limit or market */}
            {/* if active then bg-[#1F2026] text-neutral-200 else bg-[#14151B] */}
            <div className="w-full flex items-center gap-2 mt-1 h-8 text-sm bg-[#14151B]">
              <div
                onClick={() => setType("LIMIT")}
                className={`px-4 py-2 flex items-center font-medium text-sm justify-center rounded-md 
                ${type === "LIMIT" ? "bg-[#1F2026] text-neutral-200" : "bg-[#14151B] text-neutral-200"} cursor-pointer`}
              >
                Limit
              </div>
              <div
                onClick={() => setType("MARKET")}
                className={`px-4 py-2 flex items-center font-medium text-sm justify-center rounded-md text-neutral-200 
                ${type === "MARKET" ? "bg-[#1F2026] text-neutral-200" : "bg-[#14151B] text-neutral-200"}
                cursor-pointer`}
              >
                Market
              </div>
            </div>

            {/* available price */}
            <div className="w-full flex justify-between items-center text-xs py-2">
              <p className="text-gray-400">Available Equity</p>
              <p>₹100.69</p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400">Price</p>
              <input
                className="p-3 bg-[#202127] text-neutral-200 rounded-md outline-none"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400">Quantity</p>
              <input
                className="p-3 bg-[#202127] text-neutral-200 rounded-md outline-none"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <p className="text-xs text-gray-400">Leverage</p>
              <input
                className="p-3 bg-[#202127] text-neutral-200 rounded-md outline-none"
                placeholder="0-10"
              />
            </div>

            <Button label="Book Order" type="primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
