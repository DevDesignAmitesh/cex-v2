import { getSingleOrderSchema, zodErrorMessage } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import type { Request, Response } from "express";

export async function getSingleOrder(req: Request, res: Response) {
  const { data, success, error } = getSingleOrderSchema.safeParse({
    ...req.params,
    userId: req.userId
  });

  if (!success) {
    res
      .status(411)
      .json({ message: "invalid inputs", error: zodErrorMessage({ error }) });
    return;
  }

  const clientId = crypto.randomUUID();
  const response = await redisManager.waitForData({ type: "get_order", data, clientId });

  return res.json(response);
}
