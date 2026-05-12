import { getSymbolDepthSchema, zodErrorMessage } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import type { Request, Response } from "express";

export async function getSymbolDepth(req: Request, res: Response) {
  const { success, data, error } = getSymbolDepthSchema.safeParse(req.params);

  if (!success) {
    res.status(411).json({ message: "invalid inputs", error: zodErrorMessage({ error }) })
    return;
  }

  const clientId = crypto.randomUUID();
  const response = await redisManager.waitForData({ type: "get_depth", data, clientId });

  return res.json(response);
}