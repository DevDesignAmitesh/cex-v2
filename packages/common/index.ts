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

export const deleteSingleOrderSchema = z.object({
  orderId: z.uuid(),
});

export const getSymbolDepthSchema = z.object({
  symbol: z.string().includes("-"),
});

export const getSingleOrderSchema = z.object({
  orderId: z.uuid(),
  userId: z.uuid(),
});

export const getOrdersSchema = z.object({
  open: z.boolean().default(false),
  userId: z.uuid(),
});

export const createOrderSchema = z.object({
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["LIMIT", "MARKET"]),
  symbol: z.string().includes("/"),
  price: z.number().optional(),
  qty: z.number().optional(),
  userId: z.uuid(),
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

export type RedisQueueData =
  | {
      type: "create_order";
      data: CreateOrder;
      clientId: string;
    }
  | {
      type: "cancel_order";
      data: { orderId: string; userId: string };
      clientId: string;
    }
  | {
      type: "get_order";
      data: { orderId: string; userId: string };
      clientId: string;
    }
  | {
      type: "get_depth";
      data: { symbol: string };
      clientId: string;
    }
  | {
      type: "get_orders";
      data: { userId: string; open?: boolean };
      clientId: string;
    }
  | {
      type: "get_fills";
      data: { userId: string };
      clientId: string;
    }
  | {
      type: "get_user_balance";
      data: { userId: string };
      clientId: string;
    };

export type EngineCommandType =
  | "create_order"
  | "get_depth"
  | "get_user_balance"
  | "get_order"
  | "get_orders"
  | "get_fills"
  | "cancel_order";

export interface EngineResponse {
  clientId: string;
  ok: boolean;
  data?: {
    message: string,
    data: unknown
  }
  error?: string;
}

export type BalanceKey = "INR" | "AXIS" | "HDFC" | "TATA";

export type Balance = Record<
  string,
  Record<
    BalanceKey,
    {
      total: number;
      locked: number;
    }
  >
>;

export type Order = {
  id: string;
  userId: string;
  market: BalanceKey;
  price: number;
  qty: number;
  type: orderType;
  side: orderSide
  filledQty: number;
  status: "FILLED" | "CANCELLED" | "PARTIAL_FILLED" | "OPEN";
  createdAt: Date;
};

export type orderSide = "BUY" | "SELL";
export type orderType = "LIMIT" | "MARKET";

export type OrderBookKey = "AXIS" | "HDFC" | "TATA";

export type OrderBook = Record<
  OrderBookKey,
  {
    bids: Record<
      string,
      {
        totalQuantity: number;
      }
    >;
    asks: Record<
      string,
      {
        totalQuantity: number;
      }
    >;
    lastTradedPrice: number;
  }
>;

export type Fill = {
  id: string;
  qty: number;
  type: "MAKER" | "TAKER";
  side: orderSide;
  userId: string;
  price: number;
  asset: BalanceKey;
  orderId: string;
  createdAt: Date;
};

export type REDIS_QUEUE_TYPE = "http-to-orderbook-queue" | "orderbook-to-db-queue"
