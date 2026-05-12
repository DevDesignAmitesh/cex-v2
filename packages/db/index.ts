import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./prisma/generated/prisma/client";

const adapter = new PrismaPg(process.env.DATABASE_URL!);

export const prisma = new PrismaClient({
  adapter
})