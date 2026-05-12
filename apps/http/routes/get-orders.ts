import { getOrdersSchema, zodErrorMessage } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import type { Request, Response } from "express";

export async function getOrders(req: Request, res: Response) {
  // ?open=true
  const { success, error, data } = getOrdersSchema.safeParse({
    ...req.query,
    userId: req.userId
  });

  if (!success) {
    res.status(411).json({ message: "invalid inputs", error: zodErrorMessage({ error }) })
    return;
  }
  
  const clientId = crypto.randomUUID();
  
  const response = await redisManager.waitForData({
    type: "get_orders",
    data,
    clientId,
  });

  return res.json(response);
}
