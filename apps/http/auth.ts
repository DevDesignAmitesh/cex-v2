import { verifyToken } from "@repo/common/common";
import type { NextFunction, Request, Response } from "express";
import { SECRET } from "./env";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).json({ message: "un-authorized" });
    return;
  }
  
  const bearerToken = token.split("Bearer ")[1];

  if (!bearerToken) {
    res.status(401).json({ message: "un-authorized" });
    return;
  }

  const decoded = verifyToken(bearerToken, SECRET);
  
  if (!decoded) {
    res.status(401).json({ message: "un-authorized" });
    return;
  }
  
  req.userId = decoded.userId;
  next();
}