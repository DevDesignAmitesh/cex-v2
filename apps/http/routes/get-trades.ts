import { HTTP_BACKEND_STREAM_CONFIGS, ORDER_ENGINE_STREAM_CONFIGS, zodErrorMessage, type EngineResponse } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import type { Request, Response } from "express";

export async function getTrades(req: Request, res: Response) {
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
        type: "get_trades",
        data: null,
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
    return res
      .status(finalData.ok ? 201 : 400)
      .json(finalData.ok ? finalData.data : finalData.error);
  }
}
