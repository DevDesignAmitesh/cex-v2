"use client";

import Button from "@/components/button";
import OrderBook from "@/components/orderbook";
import OrderSwaping from "@/components/orderswaping";
import OtherDetails from "@/components/otherdetails";
import TradingChart from "@/components/tradingchart";
import { useCallback, useEffect, useState } from "react";
import {
  addBalanceSchema,
  Candle,
  ChartData,
  ClientOrderBook,
  createOrderClientSchema,
  Order,
  orderSide,
  orderType,
  zodErrorMessage,
} from "@repo/common/common";
import { HTTP_URL, WS_URL } from "@/utils";
import { useAuth } from "@/context/auth";
import axios from "axios";
import { toast } from "sonner";

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

  const { isLoggedIn } = useAuth();

  const getKlines = useCallback(async () => {
    const res = await axios.get(
      `${HTTP_URL}/klines?market=${symbol.split("-")[1]}&interval=1h`,
      {
        validateStatus: () => true,
      },
    );

    console.log("response from getKlines");
    console.log(res.data);

    if (res.status <= 201) {
      const chartData = res.data.candles.map((candle: Candle) => ({
        time: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      console.log("chartData", chartData);

      setChartData(chartData);
    }
  }, [symbol]);

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

    console.log("response from book order", res);

    if (res.status <= 201) {
      toast.success(res.data.message ?? "Order booked");
    } else {
      toast.error(res.data ?? "Something went wrong");
    }
  }

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
    const res = await axios.get(`${HTTP_URL}/balance`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      validateStatus: () => true,
    });

    console.log("respone from getBalance", res.data);
    setBalance({
      amount: res.data.data.INR.total - res.data.data.INR.locked,
      qty: res.data.data.AXIS.total - res.data.data.AXIS.locked,
    });
  }, []);

  async function addBalance() {
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

    console.log("respone from getBalance", res.data);

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

    console.log("respone from getDepth", res.data);

    if (res.status <= 201) {
      setOrderbook(res.data.orderbookToSend);
    }
  }, [symbol]);

  useEffect(() => {
    queueMicrotask(() => {
      void getTrades();
      void getBalance();
      void getKlines();
    });
  }, [getBalance, getKlines, getTrades, orderBook]);

  useEffect(() => {
    queueMicrotask(() => {
      void getDepth();
      void getBalance();
      void getKlines();
    });
  }, [getBalance, getDepth, getKlines]);

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

      console.log("incomming data");
      console.log(parsedData);

      if (parsedData.type === "order_book") {
        setOrderbook(parsedData.data);
      }
    };
  }, [symbol]);

  return (
    <>
      <div className="w-full min-h-screen bg-[#0E0F14] relative overflow-y-auto">
        <div className="py-4 text-neutral-100 w-full max-w-7xl mx-auto min-h-screen flex flex-col font-mono">
          <div className="flex mb-2 items-center justify-between gap-6 p-4 bg-[#14151B] shrink-0 rounded-md">
            <div className="flex gap-6 items-center">
              <p className="font-medium">
                {symbol.split("-")[0]} -{" "}
                <span className="text-gray-400">{symbol.split("-")[1]}</span>
              </p>

              <p
                title="Last traded price"
                className={
                  lastTradedPriceSide === null
                    ? "text-gray-500"
                    : lastTradedPriceSide === "SELL"
                      ? "text-red-500"
                      : "text-green-500"
                }
              >
                {orderBook.lastTradedPrice}
              </p>
            </div>

            <Button
              label="Deposit"
              type="secondary"
              onClick={() => setAmountDepositPopup(true)}
            />
          </div>

          <div className="flex flex-1 gap-2 min-h-[660px]">
            <div className="flex flex-1 min-w-0 flex-col gap-2">
              <div className="flex flex-1 min-h-[500px] gap-2">
                <TradingChart chartData={chartData} />
                <OrderBook
                  orderBook={orderBook}
                  orderbookType={orderbookType}
                  trades={trades}
                  lastTradedPriceSide={lastTradedPriceSide}
                  onOrderbookTypeChange={setOrderbookType}
                />
              </div>

              <OtherDetails balance={balance} trades={trades} />
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
        <div className="bg-black/80 z-10 inset-0 fixed flex flex-col gap-10 justify-center items-center">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400">Amount</p>
            <input
              className="p-3 bg-[#202127] text-neutral-200 rounded-md outline-none"
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>

          <div className="flex justify-center items-center gap-6">
            <Button label="Deposit" onClick={addBalance} type="primary" />
            <Button
              label="Cancel"
              onClick={() => setAmountDepositPopup(false)}
              type="secondary"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default TradePage;
