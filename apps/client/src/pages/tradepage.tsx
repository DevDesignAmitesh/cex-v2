"use client";

import Button from "@/components/button";
import { useEffect, useState } from "react";
import {
  ClientOrderBook,
  createOrderClientSchema,
  Order,
  orderSide,
  orderType,
  zodErrorMessage,
} from "@repo/common/common";
import Image from "next/image";
import { HTTP_URL, WS_URL } from "@/utils";
import { useAuth } from "@/context/auth";
import axios from "axios";

export function TradePage({ symbol }: { symbol: string }) {
  const [side, setSide] = useState<orderSide>("BUY");
  const [type, setType] = useState<orderType>("LIMIT");
  const [orderbookType, setOrderbookType] = useState<"BOOK" | "TRADES">("BOOK");
  const [price, setPrice] = useState<number>(0);
  const [qty, setQty] = useState<number>(0);
  const [orderBook, setOrderbook] = useState<ClientOrderBook>({
    asks: [],
    bids: [],
    lastTradedPrice: 0,
  });
  const [trades, setTrades] = useState<Order[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const { isLoggedIn } = useAuth();

  async function bookOrder() {
    if (!isLoggedIn) return;

    const { data, success, error } = createOrderClientSchema.safeParse({
      symbol: `${symbol.split("-")[0]}/${symbol.split("-")[1]}`,
      price,
      qty,
      side,
      type,
      market: "SPOT",
    });

    if (!success) {
      alert(zodErrorMessage({ error }));
      return;
    }

    const res = await axios.post(`${HTTP_URL}/order`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      validateStatus: () => true,
    });

    if (res.status <= 201) {
      alert(res.data.message ?? "Order booked");
    } else {
      alert(res.data.message ?? "Something went wrong");
    }
  }

  async function getTrades() {
    const res = await axios.get(`${HTTP_URL}/trades`, {
      validateStatus: () => true,
    });

    console.log("respone from getTrades", res.data);

    if (res.status <= 201) {
      setTrades(res.data.data);
    }
  }

  useEffect(() => {
    getTrades();
  }, [orderBook]);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    setWs(ws);

    ws.onopen = () => console.log("connected");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "SUBSCRIBE",
          payload: { symbol },
        }),
      );
    };

    ws.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);

      console.log("incomming data");
      console.log(parsedData);

      if (parsedData.type === "order_book") {
        setOrderbook(parsedData.data);
      }
    };
  }, []);

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
            {orderBook.lastTradedPrice}
          </p>
        </div>

        {/* Main 3-Column Layout */}
        <div className="flex flex-1 overflow-hidden gap-2">
          {/* ── Column 1: Chart ── */}
          <div className="h-fit flex flex-col justify-center items-center flex-1 min-w-0 bg-[#14151B]">
            {/* for now 😭 */}
            <Image
              src={"/meme.png"}
              height={100}
              width={100}
              alt="makhi-machro"
              className="w-xs scale-70"
            />
          </div>

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

              {orderbookType === "BOOK" ? (
                <div className="overflow-y-auto w-full h-115 scrollbar-thin scrollbar-thumb-black/40">
                  <div className="flex flex-col">
                    {orderBook.asks
                      .slice()
                      .reverse()
                      .map((ask, idx) => {
                        const maxQty = Math.max(
                          ...orderBook.asks.map((a) => a.qty),
                        );

                        const width = (ask.qty / maxQty) * 100;

                        return (
                          <div
                            key={idx}
                            className="relative grid grid-cols-2 px-4 py-0.75 overflow-hidden"
                          >
                            {/* depth bg */}
                            <div
                              className="absolute right-0 top-0 h-full bg-red-500/15"
                              style={{
                                width: `${width}%`,
                              }}
                            />

                            <p className="relative z-10 text-red-400">
                              {ask.price.toFixed(2)}
                            </p>

                            <p className="relative z-10 text-right text-gray-300">
                              {ask.qty.toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                  </div>

                  {/* Mid Price */}
                  <div className="flex items-center gap-2 px-4 py-3 border-y border-white/5">
                    <p className="text-2xl font-semibold text-green-400">
                      {orderBook.lastTradedPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Bids */}
                  <div className="flex flex-col">
                    {orderBook.bids.map((bid, idx) => {
                      const maxQty = Math.max(
                        ...orderBook.bids.map((b) => b.qty),
                      );

                      const width = (bid.qty / maxQty) * 100;

                      return (
                        <div
                          key={idx}
                          className="relative grid grid-cols-2 px-4 py-0.75 overflow-hidden"
                        >
                          {/* depth bg */}
                          <div
                            className="absolute right-0 top-0 h-full bg-green-500/15"
                            style={{
                              width: `${width}%`,
                            }}
                          />

                          <p className="relative z-10 text-green-400">
                            {bid.price.toFixed(2)}
                          </p>

                          <p className="relative z-10 text-right text-gray-300">
                            {bid.qty.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto w-full h-115 scrollbar-thin scrollbar-thumb-black/40">
                  <div className="flex flex-col">
                    {trades.map((trd, idx) => {
                      return (
                        <div
                          key={idx}
                          className="relative grid grid-cols-2 px-4 py-0.75 overflow-hidden"
                        >
                          <p
                            className={`relative z-10 
                              ${trd.side === "SELL" ? "text-red-400" : "text-green-400"}`}
                          >
                            {trd.price}
                          </p>

                          <p className="relative z-10 text-right text-gray-300">
                            {trd.qty}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400">Quantity</p>
              <input
                className="p-3 bg-[#202127] text-neutral-200 rounded-md outline-none"
                placeholder="0"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <p className="text-xs text-gray-400">Leverage</p>
              <input
                className="p-3 bg-[#202127] text-neutral-200 rounded-md outline-none"
                placeholder="0-10"
                disabled
              />
            </div>

            <Button
              label={isLoggedIn ? "Book Order" : "Sign in"}
              isLink={!isLoggedIn}
              href={!isLoggedIn ? "/auth" : ""}
              onClick={isLoggedIn ? bookOrder : undefined}
              type="primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
