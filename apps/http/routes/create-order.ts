import { createOrderSchema, zodErrorMessage } from "@repo/common/common";
import type { Request, Response } from "express";
import { redisManager } from "@repo/redis/redis";

export async function createOrder(
  req: Request,
  res: Response,
) {
  const orderId = crypto.randomUUID();

  const { data, success, error } = createOrderSchema.safeParse({
    ...req.body,
    userId: req.userId,
    market: req.params.market,
    orderId,
    way: "MANUAL",
  });

  if (!success) {
    res
      .status(411)
      .json({ message: "invalid inputs", error: zodErrorMessage({ error }) });
    return;
  }
    
  const clientId = crypto.randomUUID();
  const response = await redisManager.waitForData({ type: "create_order", data, clientId }, "http-to-orderbook-queue");

<<<<<<< HEAD
    // putting data in this
    ORDER_ENGINE_STREAM_CONFIGS.stream,
    {
      // data to send to the queue
      type: "from-http-backend",
      data: {
        type: "create_order",
        data,
        clientId,
        responseStream: HTTP_BACKEND_STREAM_CONFIGS.stream
      }
    },
  );

  const finalData = JSON.parse(response.messages[0]?.message.data ?? "{}") as EngineResponse;
  
  if (finalData.clientId === clientId) {
    return res.status(finalData.ok ? 201 : 400).json(finalData.ok ? finalData.data : finalData.error);
  }
=======
  return res.status(response.ok ? 201 : 400).json(response);
>>>>>>> parent of cc0e989 (migrated create_order to redis streams)
}
