import { getKlinesSchema, zodErrorMessage, type Candle } from "@repo/common/common";
import { prisma } from "@repo/db/db";
import type { Request, Response } from "express";

const INTERVALS = {
  "1m": 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toISOString().split("T")[0]!;
}

export async function generateCandles(
  market: "AXIS" | "TATA",
  interval: keyof typeof INTERVALS,
) {
  const bucketSize = INTERVALS[interval];

  const fills = await prisma.fill.findMany({
    where: {
      asset: market,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const candlesMap = new Map<number, Candle>();

  if (fills.length >= 1) {
    for (const fill of fills) {
      const timestamp = fill.createdAt.getTime();
  
      const bucket = Math.floor(timestamp / bucketSize) * bucketSize;
  
      if (!candlesMap.has(bucket)) {
        candlesMap.set(bucket, {
          timestamp: formatDate(bucket),
          open: fill.price,
          high: fill.price,
          low: fill.price,
          close: fill.price,
          volume: fill.filledQty,
        });
  
        continue;
      }
  
      const candle = candlesMap.get(bucket);
  
      candle!.high = Math.max(candle!.high, fill.price);
      candle!.low = Math.min(candle!.low, fill.price);
      candle!.close = fill.price;
      candle!.volume += fill.filledQty;
    }
  
    return Array.from(candlesMap.values());
  }

  return []
}

export async function getKlines(req: Request, res: Response) {
  const { success, data, error } = getKlinesSchema.safeParse(req.query);

  if (!success) {
    res.json({ message: "invalid inputs", data: zodErrorMessage({ error })})
    return;
  }

  const { market, interval } = data;
  
  res.json({ candles: await generateCandles(market, interval) })
}
