import z, { type ZodError } from "zod";
import { sign, verify, type JwtPayload } from "jsonwebtoken";

export const zodErrorMessage = ({ error }: { error: ZodError }) => {
  return error.issues.map((er) => `${er.path.join(".")}: ${er.message}`);
};

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(3, "password should be atleast 4 words"),
});

export const signinSchema = z.object({
  email: z.email(),
  password: z.string().min(3, "password should be atleast 4 words"),
});

export const createOrderSchema = z.object({
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["LIMIT", "MARKET"]),
  symbol: z.string().includes("/"),
  price: z.number().optional(),
  qty: z.number().optional(),
  userId: z.string(),
  ioc: z.boolean().default(false),
});

type CreateOrder = z.infer<typeof createOrderSchema>;

export const generateToken = (userId: string, secret: string) => {
  return sign({ userId }, secret);
};

export const verifyToken = (token: string, secret: string) => {
  try {
    return verify(token, secret) as JwtPayload;
  } catch (e) {
    console.log("verify token error ", e);
    return null;
  }
};

export type RedisQueueData = {
  type: "create_order";
  data: CreateOrder;
  clientId: string;
};

export type EngineCommandType =
  | "create_order"
  | "get_depth"
  | "get_user_balance"
  | "get_order"
  | "cancel_order";

export interface EngineResponse {
  clientId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}
