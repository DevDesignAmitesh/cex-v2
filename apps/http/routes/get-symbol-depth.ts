import {
  getSymbolDepthSchema,
  HTTP_BACKEND_STREAM_CONFIGS,
  ORDER_ENGINE_STREAM_CONFIGS,
  zodErrorMessage,
  type ClientOrderBook,
  type EngineResponse,
} from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import type { Request, Response } from "express";

export async function getSymbolDepth(req: Request, res: Response) {
  const { success, data, error } = getSymbolDepthSchema.safeParse(req.params);

  if (!success) {
    res
      .status(411)
      .json({ message: "invalid inputs", error: zodErrorMessage({ error }) });
    return;
  }

  const clientId = crypto.randomUUID();
  const response = await redisManager.waitForData(
    // watiitng for getting data from this thing
    HTTP_BACKEND_STREAM_CONFIGS.group_name,
    HTTP_BACKEND_STREAM_CONFIGS.consumer_grp,
    HTTP_BACKEND_STREAM_CONFIGS.stream,

    // putting data in this
    ORDER_ENGINE_STREAM_CONFIGS.stream,
    {
      // data to send to the queue
      type: "http-to-engine",
      data: {
        type: "get_depth",
        data,
        clientId,
        responseStream: HTTP_BACKEND_STREAM_CONFIGS.stream,
        responseGroup: HTTP_BACKEND_STREAM_CONFIGS.group_name,
      },
    },
  );

  const finalData = JSON.parse(
    response.messages[0]?.message.data ?? "{}",
  ) as EngineResponse;

  if (finalData.clientId === clientId) {

    console.log("finalData in http", finalData.data)
    
    let orderbookToSend: ClientOrderBook = {
      asks: [],
      bids: [],
      lastTradedPrice: 0,
    };

    if (finalData.ok) {
      orderbookToSend.lastTradedPrice = finalData.data.data.lastTradedPrice;
  
      Object.entries(finalData.data.data.asks).map(([key, value]) => {
        orderbookToSend.asks.push({
          price: Number(key),
          qty: value.totalQuantity,
        });
      });
  
      Object.entries(finalData.data.data.bids).map(([key, value]) => {
        orderbookToSend.bids.push({
          price: Number(key),
          qty: value.totalQuantity,
        });
      });
      return res
        .status(201)
        .json({
          message: finalData.data?.message,
          orderbookToSend
        });
      } else {
      return res
        .status(400)
        .json(finalData.error);
    }

  }
}
