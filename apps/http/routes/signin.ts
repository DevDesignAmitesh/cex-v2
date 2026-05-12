import type { Request, Response } from "express";
import { prisma } from "@repo/db/db";
import {
  signinSchema,
  zodErrorMessage,
  generateToken,
} from "@repo/common/common";
import { compare } from "bcrypt";
import { SECRET } from "../env";

export async function signin(req: Request, res: Response) {
  const { data, success, error } = signinSchema.safeParse(req.body);

  if (!success) {
    res
      .status(411)
      .json({ message: "invalid inputs", data: zodErrorMessage({ error }) });
    return;
  }

  const { email, password } = data;

  const existingUser = await prisma.user.findFirst({
    where: { email },
  });

  if (!existingUser) {
    res.status(403).json({ message: "user with email not found" });
    return;
  }

  const isPasswordValid = await compare(password, existingUser.password);

  if (!isPasswordValid) {
    res.status(403).json({ message: "invalid password" });
    return;
  }

  const token = generateToken(existingUser.id, SECRET);

  return res.status(201).json({
    message: "signin successfull",
    token,
  });
}
