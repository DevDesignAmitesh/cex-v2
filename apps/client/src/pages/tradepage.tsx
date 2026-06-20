"use client";

import Button from "@/components/button";
import OrderBook from "@/components/orderbook";
import OrderSwaping from "@/components/orderswaping";
import OtherDetails from "@/components/otherdetails";
import TradingChart, { type ChartInterval } from "@/components/tradingchart";
import { IndianRupee, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  addBalanceSchema,
  Candle,
  ChartData,
  ClientOrderBook,
  createOrderClientSchema,
  Fill,
  Order,
  orderSide,
  orderType,
  zodErrorMessage,
} from "@repo/common/common";
import { HTTP_URL, WS_URL } from "@/utils";
import { useAuth } from "@/context/auth";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export function TradePage({ symbol }: { symbol: string }) {
  const [side, setSide] = useState<orderSide>("BUY");
  const [type, setType] = useState<orderType>("LIMIT");
  const [orderbookType, setOrderbookType] = useState<"BOOK" | "TRADES">("BOOK");
  const [balance, setBalance] = useState({
    amount: 0,
    qty: 0,
  });
  const [price, setPrice] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [qty, setQty] = useState<number>(0);
  const [orderBook, setOrderbook] = useState<ClientOrderBook>({
    asks: [],
    bids: [],
    lastTradedPrice: 0,
  });
  const [trades, setTrades] = useState<Order[]>([]);
  const [lastTradedPriceSide, setLastTradedPriceSide] =
    useState<orderSide | null>(null);
  const [amountDepositPopup, setAmountDepositPopup] = useState<boolean>(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartInterval, setChartInterval] = useState<ChartInterval>("1h");
  const [orders, setOrders] = useState<Order[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [accountDetailsRefreshing, setAccountDetailsRefreshing] =
    useState<boolean>(false);
    
  const router = useRouter();

  const context = useAuth();
  if (!context) {
    return null
  }
  
  const isLoggedIn = context?.isLoggedIn ?? false;
  const profile = context?.profile ?? null;
  const logout = context?.logout ?? (() => undefined);

  const getKlines = useCallback(async () => {
    const res = await axios.get(
      `${HTTP_URL}/klines?market=${symbol.split("-")[1]}&interval=${chartInterval}`,
      {
        validateStatus: () => true,
      },
    );

    if (res.status <= 201) {
      const chartData = res.data.candles.map((candle: Candle) => ({
        time: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      setChartData(chartData);
    }
  }, [chartInterval, symbol]);

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
      toast.error(zodErrorMessage({ error }));
      return;
    }

    const res = await axios.post(`${HTTP_URL}/order`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      validateStatus: () => true,
    });

    if (res.status <= 201) {
      toast.success(res.data.message ?? "Order booked");
    } else {
      toast.error(res.data ?? "Something went wrong");
    }
  }

  const getOrders = useCallback(async () => {
    if (!isLoggedIn) {
      setOrders([]);
      return;
    }

    const res = await axios.get(`${HTTP_URL}/orders`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      validateStatus: () => true,
    });

    if (res.status <= 201) {
      setOrders(res.data.data);
    }
  }, [isLoggedIn]);

  const getFills = useCallback(async () => {
    if (!isLoggedIn) {
      setFills([]);
      return;
    }

    const res = await axios.get(`${HTTP_URL}/fills`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      validateStatus: () => true,
    });

    if (res.status <= 201) {
      setFills(res.data.data);
    }
  }, [isLoggedIn]);

  const getTrades = useCallback(async () => {
    const res = await axios.get(`${HTTP_URL}/trades`, {
      validateStatus: () => true,
    });

    if (res.status <= 201) {
      setTrades(res.data.data);
      setLastTradedPriceSide(res.data.data.at(-1)?.side ?? null);
    }
  }, []);

  const getBalance = useCallback(async () => {
    if (!isLoggedIn) {
      setBalance({ amount: 0, qty: 0 });
      return;
    }

    const res = await axios.get(`${HTTP_URL}/balance`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      validateStatus: () => true,
    });

    setBalance({
      amount: res.data.data.INR.total - res.data.data.INR.locked,
      qty: res.data.data.AXIS.total - res.data.data.AXIS.locked,
    });
  }, [isLoggedIn]);

  async function addBalance() {
    if (!isLoggedIn) return;

    const { data, success, error } = addBalanceSchema.safeParse({ amount });

    if (!success) {
      toast.error(zodErrorMessage({ error }));
      return;
    }

    const res = await axios.post(`${HTTP_URL}/balance`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      validateStatus: () => true,
    });

    if (res.data.data === true) {
      getBalance();
      setAmountDepositPopup(false);
      toast.success(res.data.message);
    } else {
      toast.error(res.data.message);
    }
  }

  const getDepth = useCallback(async () => {
    const res = await axios.get(`${HTTP_URL}/depth/${symbol}`, {
      validateStatus: () => true,
    });

    if (res.status <= 201) {
      setOrderbook(res.data.orderbookToSend);
    }
  }, [symbol]);

  const refreshAccountDetails = useCallback(async () => {
    if (!isLoggedIn) return;

    setAccountDetailsRefreshing(true);
    await Promise.all([getBalance(), getOrders(), getFills()]);
    setAccountDetailsRefreshing(false);
  }, [getBalance, getFills, getOrders, isLoggedIn]);

  function handleLogout() {
    logout();
    setProfileMenuOpen(false);
    router.push("/auth");
  }

  useEffect(() => {
    queueMicrotask(() => {
      void getTrades();
      void getKlines();
      void getBalance();
    });
  }, [getKlines, getTrades, getBalance, orderBook]);

  useEffect(() => {
    queueMicrotask(() => {
      void getDepth();
      void getKlines();
    });
  }, [getDepth, getKlines]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshAccountDetails();
    });
  }, [refreshAccountDetails]);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

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

      if (parsedData.type === "order_book") {
        setOrderbook(parsedData.data);
      }
    };
  }, [symbol]);

  return (
    <>
      <div className="w-full min-h-screen bg-[#0E0F14] relative overflow-y-auto px-3">
        <div className="py-3 text-neutral-100 w-full max-w-[1500px] mx-auto min-h-screen flex flex-col font-mono">
          <div className="flex mb-2 flex-col gap-4 rounded-xl border border-white/10 bg-[#14151B]/95 p-3 shadow-xl shadow-black/20 shrink-0 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-center gap-8">
              <Logo />

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">
                  Market
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {symbol.split("-")[0]}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-400">
                    {symbol.split("-")[1]}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-white/10" />

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">
                  Last Traded Price
                </span>

                <span
                  className={`text-lg font-semibold ${
                    lastTradedPriceSide === null
                      ? "text-gray-500"
                      : lastTradedPriceSide === "SELL"
                        ? "text-red-500"
                        : "text-green-500"
                  }`}
                >
                  {orderBook.lastTradedPrice}
                </span>
              </div>
            </div>

            <div className="relative flex flex-wrap items-center gap-2">
              {isLoggedIn ? (
                <>
                  <Button
                    label="Deposit"
                    type="secondary"
                    onClick={() => setAmountDepositPopup(true)}
                  />
                  <button
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="rounded-md border border-white/10 bg-[#202127] px-4 py-2 text-sm text-neutral-100 hover:bg-[#26272e] flex justify-center items-center gap-2"
                  >
                      <User size={18} />
                      {profile?.name ?? "Profile"}
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-11 z-20 w-64 rounded-md border border-white/10 bg-[#14151B] p-3 shadow-2xl">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="mt-1 font-medium text-neutral-100">
                        {profile?.name ?? "Loading..."}
                      </p>
                      <p className="mt-1 break-all text-xs text-gray-500">
                        {profile?.id ?? ""}
                      </p>

                      <button
                        onClick={handleLogout}
                        className="mt-4 w-full rounded-md bg-red-500/10 px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/20"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Button label="Sign in" type="secondary" isLink href="/auth" />
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 xl:flex-row">
            <div className="flex flex-1 min-w-0 flex-col gap-2">
              <div className="flex flex-1 flex-col gap-2 lg:min-h-[500px] lg:flex-row">
                <TradingChart
                  chartData={chartData}
                  interval={chartInterval}
                  onIntervalChange={setChartInterval}
                />
                <OrderBook
                  orderBook={orderBook}
                  orderbookType={orderbookType}
                  trades={trades}
                  lastTradedPriceSide={lastTradedPriceSide}
                  onOrderbookTypeChange={setOrderbookType}
                />
              </div>

              {isLoggedIn && (
                  <OtherDetails
                  balance={balance}
                  orders={orders}
                  fills={fills}
                  profile={profile}
                  isRefreshing={accountDetailsRefreshing}
                  onRefresh={refreshAccountDetails}
                />
              )}
            </div>

            <OrderSwaping
              side={side}
              type={type}
              balance={balance}
              price={price}
              qty={qty}
              isLoggedIn={isLoggedIn}
              onSideChange={setSide}
              onTypeChange={setType}
              onPriceChange={setPrice}
              onQtyChange={setQty}
              onBookOrder={bookOrder}
            />
          </div>
        </div>
      </div>

      {amountDepositPopup && isLoggedIn && (
        <div className="bg-black/80 z-20 inset-0 fixed flex justify-center items-center px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#14151B] p-5 text-neutral-100 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-blue-300">
                  Add balance
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Deposit INR</h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Funds are credited to your available equity for demo trading.
                </p>
              </div>
              <button
                onClick={() => setAmountDepositPopup(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-neutral-300 hover:bg-white/15"
                title="Close deposit popup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <p className="text-xs text-gray-400">Amount</p>
              <div className="flex items-center rounded-xl border border-white/10 bg-[#202127] px-3 focus-within:border-blue-400/60">
                <IndianRupee size={18} className="text-gray-400" />
                <input
                  className="min-w-0 flex-1 bg-transparent p-3 text-neutral-200 outline-none"
                  placeholder="0"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button label="Deposit" onClick={addBalance} type="primary" className="w-full" />
              <Button
                label="Cancel"
                onClick={() => setAmountDepositPopup(false)}
                type="secondary"
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TradePage;
