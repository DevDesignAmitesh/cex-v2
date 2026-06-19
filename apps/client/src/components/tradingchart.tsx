"use client";

import { useEffect, useRef } from "react";
import { CandlestickSeries, ColorType, createChart } from "lightweight-charts";
import type { ChartData } from "@repo/common/common";

export type ChartInterval = "1m" | "1h" | "1d" | "1w";

type TradingChartProps = {
  chartData: ChartData[];
  interval: ChartInterval;
  onIntervalChange: (interval: ChartInterval) => void;
};

const intervals: ChartInterval[] = ["1m", "1h", "1d", "1w"];

export default function TradingChart({
  chartData,
  interval,
  onIntervalChange,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "#0f172a",
        },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: {
          color: "#1e293b",
        },
        horzLines: {
          color: "#1e293b",
        },
      },
      rightPriceScale: {
        borderColor: "#334155",
      },
      timeScale: {
        borderColor: "#334155",
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candlestickSeries.setData(chartData);

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0,
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [chartData]);

  return (
    <section className="flex flex-col flex-1 min-w-0 bg-[#14151B] rounded-md overflow-hidden">
      <div className="flex items-center justify-end gap-1 border-b border-white/5 px-3 py-2">
        {intervals.map((item) => (
          <button
            key={item}
            onClick={() => onIntervalChange(item)}
            className={`h-8 min-w-10 rounded-md px-3 text-xs font-medium ${
              interval === item
                ? "bg-[#202127] text-neutral-100"
                : "text-neutral-400 hover:bg-[#202127] hover:text-neutral-100"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div
        ref={chartContainerRef}
        className="w-full flex-1 rounded-lg overflow-hidden"
      />
    </section>
  );
}
