import { createOrderSchema, zodErrorMessage } from "@repo/common/common";
import type { Request, Response } from "express";
import { redisManager } from "@repo/redis/redis";

export async function createOrder(
  req: Request,
  res: Response,
) {
  const { data, success, error } = createOrderSchema.safeParse({
    ...req.body,
    userId: req.userId,
  });

  console.log(req.body);
  
  if (!success) {
    res
      .status(411)
      .json({ message: "invalid inputs", data: zodErrorMessage({ error }) });
    return;
  }

  const clientId = crypto.randomUUID();
  const response = await redisManager.waitForData({ type: "create_order", data, clientId });

  return res.json(response);
}
