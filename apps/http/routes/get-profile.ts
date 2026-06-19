import { prisma } from "@repo/db/db";
import type { Request, Response } from "express";

export async function profile(req: Request, res: Response) {
  const userId = req.userId;

  const user = await prisma.user.findFirst({
    where: { id: userId },
    omit: { password: true }
  });

  if (!user) {
    res.status(403).json({ message: "user not found" })
    return;
  }

  res.json({ message: "profile found", profile: { id: user.id, name: user.username }})
}