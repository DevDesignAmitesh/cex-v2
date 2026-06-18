"use client";

import Button from "@/components/button";
import type { orderSide, orderType } from "@repo/common/common";

type OrderSwapingProps = {
  side: orderSide;
  type: orderType;
  balance: {
    amount: number;
    qty: number;
  };
  price: number;
  qty: number;
  isLoggedIn: boolean;
  onSideChange: (side: orderSide) => void;
  onTypeChange: (type: orderType) => void;
  onPriceChange: (price: number) => void;
  onQtyChange: (qty: number) => void;
  onBookOrder: () => void;
};

export default function OrderSwaping({
  side,
  type,
  balance,
  price,
  qty,
  isLoggedIn,
  onSideChange,
  onTypeChange,
  onPriceChange,
  onQtyChange,
  onBookOrder,
}: OrderSwapingProps) {
  return (
    <aside className="flex gap-2 flex-col w-64 shrink-0 bg-[#14151B] px-2 py-4 rounded-md">
      <div className="w-full flex items-center gap-2 h-12 text-sm bg-[#14151B]">
        <button
          onClick={() => onSideChange("BUY")}
          className={`w-full h-full flex items-center font-semibold justify-center rounded-md cursor-pointer ${
            side === "BUY"
              ? "bg-[#122322] text-green-500"
              : "bg-[#14151B] text-neutral-200"
          }`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => onSideChange("SELL")}
          className={`w-full h-full flex items-center font-semibold justify-center rounded-md cursor-pointer ${
            side === "SELL"
              ? "bg-[#351A1F] text-red-500"
              : "bg-[#14151B] text-neutral-200"
          }`}
        >
          Sell / Short
        </button>
      </div>

      <div className="w-full flex items-center gap-2 mt-1 h-8 text-sm bg-[#14151B]">
        <button
          onClick={() => onTypeChange("LIMIT")}
          className={`px-4 py-2 flex items-center font-medium text-sm justify-center rounded-md cursor-pointer ${
            type === "LIMIT"
              ? "bg-[#1F2026] text-neutral-200"
              : "bg-[#14151B] text-neutral-200"
          }`}
        >
          Limit
        </button>
        <button
          onClick={() => onTypeChange("MARKET")}
          className={`px-4 py-2 flex items-center font-medium text-sm justify-center rounded-md text-neutral-200 cursor-pointer ${
            type === "MARKET"
              ? "bg-[#1F2026] text-neutral-200"
              : "bg-[#14151B] text-neutral-200"
          }`}
        >
          Market
        </button>
      </div>

      <div className="w-full flex justify-between items-center text-xs pt-2">
        <p className="text-gray-400">Available Equity</p>
        <p>{balance.amount}</p>
      </div>

      <div className="w-full flex justify-between items-center text-xs pb-2">
        <p className="text-gray-400">Available Qty</p>
        <p>{balance.qty}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-400">Price</p>
        <input
          className="p-3 bg-[#202127] text-neutral-200 rounded-md outline-none"
          placeholder="0"
          value={price}
          onChange={(event) => onPriceChange(Number(event.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <p className="text-xs text-gray-400">Quantity</p>
        <input
          className="p-3 bg-[#202127] text-neutral-200 rounded-md outline-none"
          placeholder="0"
          value={qty}
          onChange={(event) => onQtyChange(Number(event.target.value))}
        />
      </div>

      <Button
        label={isLoggedIn ? "Book Order" : "Sign in"}
        isLink={!isLoggedIn}
        href={!isLoggedIn ? "/auth" : ""}
        onClick={isLoggedIn ? onBookOrder : undefined}
        type="primary"
      />
    </aside>
  );
}
