import type { NextFunction, Request, Response } from "express";
import { prisma } from "@repo/db/db";
import { signupSchema, zodErrorMessage } from "@repo/common/common";
import { hash } from "bcrypt"

export async function signup(req: Request, res: Response,next: NextFunction) {
  const { data, success, error } = signupSchema.safeParse(req.body);

  if (!success) {
    res
      .status(411)
      .json({ message: "invalid inputs", error: zodErrorMessage({ error }) });
    return;
  }

  const { email, password } = data;
  const username = email.split("@")[0]!;
  
  const existingUser = await prisma.user.findFirst({
    where: { email }
  });

  if (existingUser) {
    res.status(403).json({ message: "email already exists" });
    return;
  }

  const hashedPassword = await hash(password, 4);

  await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword
    }
  });

  return res.status(201).json({
    message: "signup successfull, please signin"
  })
}
