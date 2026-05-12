import { redisManager } from "@repo/redis/redis";
import type { Request, Response } from "express";

export async function getBalance(req: Request, res: Response) {  
  const clientId = crypto.randomUUID();
  
  const response = await redisManager.waitForData({
    type: "get_user_balance",
    data: { userId: req.userId },
    clientId,
  });

  return res.json(response);
}
