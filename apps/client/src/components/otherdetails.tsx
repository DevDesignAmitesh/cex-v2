"use client";

import { useState } from "react";
import type { Fill, Order, Profile } from "@repo/common/common";

type DetailsTab = "balances" | "orders" | "fills";

type OtherDetailsProps = {
  balance: {
    amount: number;
    qty: number;
  };
  orders: Order[];
  fills: Fill[];
  profile: Profile | null;
  isRefreshing: boolean;
  onRefresh: () => void;
};

const tabs: { id: DetailsTab; label: string }[] = [
  { id: "balances", label: "balances" },
  { id: "orders", label: "orders" },
  { id: "fills", label: "fills" },
];

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFillRole(fill: Fill, profile: Profile | null) {
  if (!profile) return "UNKNOWN";
  if (fill.makerId === profile.id) return "MAKER";
  if (fill.takerId === profile.id) return "TAKER";
  return "UNKNOWN";
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="rounded bg-[#202127] px-2 py-1 text-[11px] text-neutral-300">
      {value}
    </span>
  );
}

export default function OtherDetails({
  balance,
  orders,
  fills,
  profile,
  isRefreshing,
  onRefresh,
}: OtherDetailsProps) {
  const [activeTab, setActiveTab] = useState<DetailsTab>("balances");

  return (
    <section className="bg-[#14151B] rounded-md border border-white/10 p-3 min-h-44">
      <div className="flex items-center justify-between gap-3 rounded-md border border-white/20 px-2 py-1">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === tab.id
                  ? "bg-[#202127] text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          title="Refresh account details"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 hover:bg-[#202127] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className={isRefreshing ? "animate-spin" : ""}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 1-15.5 6.3" />
            <path d="M3 12A9 9 0 0 1 18.5 5.7" />
            <path d="M18 2v4h4" />
            <path d="M6 22v-4H2" />
          </svg>
        </button>
      </div>

      <div className="mt-3 max-h-56 overflow-y-auto pr-1 text-sm scrollbar-thin scrollbar-thumb-black/40">
        {activeTab === "balances" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md bg-[#101116] p-3">
              <p className="text-xs text-gray-400">Available Equity</p>
              <p className="mt-2 text-lg font-semibold text-neutral-100">
                {balance.amount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-md bg-[#101116] p-3">
              <p className="text-xs text-gray-400">Available Qty</p>
              <p className="mt-2 text-lg font-semibold text-neutral-100">
                {balance.qty.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {activeTab === "orders" &&
          (orders.length > 0 ? (
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-2 lg:grid-cols-6 gap-3 rounded-md bg-[#101116] p-3 text-neutral-200"
                >
                  <div>
                    <p className="text-[11px] text-gray-500">Side</p>
                    <p
                      className={
                        order.side === "SELL"
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    >
                      {order.side}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Status</p>
                    <StatusPill value={order.status} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Type</p>
                    <p>{order.type}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Price</p>
                    <p>{order.price}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Qty</p>
                    <p>
                      {order.filledQty}/{order.qty}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Updated</p>
                    <p>{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center text-neutral-500">
              No orders yet
            </div>
          ))}

        {activeTab === "fills" &&
          (fills.length > 0 ? (
            <div className="space-y-2">
              {fills.map((fill) => {
                const role = getFillRole(fill, profile);

                return (
                  <div
                    key={fill.id}
                    className="grid grid-cols-2 lg:grid-cols-6 gap-3 rounded-md bg-[#101116] p-3 text-neutral-200"
                  >
                    <div>
                      <p className="text-[11px] text-gray-500">Role</p>
                      <StatusPill value={role} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Side</p>
                      <p
                        className={
                          fill.side === "SELL"
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {fill.side}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Asset</p>
                      <p>{fill.asset}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Price</p>
                      <p>{fill.price}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Filled</p>
                      <p>
                        {fill.filledQty}/{fill.askedQty}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Time</p>
                      <p>{formatDate(fill.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center text-neutral-500">
              No fills yet
            </div>
          ))}
      </div>
    </section>
  );
}
