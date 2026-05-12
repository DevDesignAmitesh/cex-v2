import { deleteSingleOrderSchema, zodErrorMessage } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import type { Request, Response } from "express";

export async function deleteSingleOrder(req: Request, res: Response) {
  const { data, success, error } = deleteSingleOrderSchema.safeParse(
    req.params,
  );

  if (!success) {
    res
      .status(411)
      .json({ message: "invalid inputs", error: zodErrorMessage({ error }) });
    return;
  }

  const clientId = crypto.randomUUID();
  const response = await redisManager.waitForData({
    type: "cancel_order",
    data: {
      orderId: data.orderId,
      userId: req.userId,
    },
    clientId,
  });

  return res.json(response);
}
