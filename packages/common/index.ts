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
  orderId: z.uuid(),
  // market: z.enum(["SPOT", "PERPS"]),
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

export type RedisDbQueueData =
  | {
      type: "create_order";
      data: {
        side: "BUY" | "SELL";
        type: "LIMIT" | "MARKET";
        userId: string;
        price: number;
        qty: number;
        status: orderStatus, 
        filledQty: number, 
        fillType: fillType
      }
    }
  | {
      type: "cancel_order";
      data: { orderId: string; userId: string };
      clientId: string;
    };

export type RedisWsQueueData =
  // | {
  //     type: "order_book";
  //     data: OrderBook
  //   }
  | {
      type: "order_book";
      data: UserBasedOrderBook
    }

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

export type BalanceKey = "INR" | "AXIS" | "COLLATERAL";

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
  status: orderStatus;
  createdAt: Date;
};

export type OrderBook = Record<
  OrderBookKey,
  {
    bids: Record<
      number,
      {
        totalQuantity: number;
      }
    >;
    asks: Record<
      number,
      {
        totalQuantity: number;
      }
    >;
    lastTradedPrice: number;
  }
>;

export type orderStatus = "FILLED" | "CANCELLED" | "PARTIAL_FILLED" | "OPEN";
export type orderSide = "BUY" | "SELL";
export type orderType = "LIMIT" | "MARKET";
export type OrderBookKey = "AXIS" | "TATA";


// export type OrderBookOrder = {
//   totalQuantity: number;
//   userId: string
//   price: number, 
//   createdAt: Date
// }

export type UserInOrderBook = { id: string, qty: number, price: number, createdAt: number }

export type OrderBookOrder = { 
  totalQuantity: number, 
  createdAt: number, 
  users: UserInOrderBook[] 
}

export type UserBasedOrderBook = Record<
  OrderBookKey,
  {
    bids: Record<
      number,
      OrderBookOrder
    >;
    asks: Record<
      number,
      OrderBookOrder
    >;
    lastTradedPrice: number;
  }
>;

export type fillType = "MAKER" | "TAKER";

export type Fill = {
  id: string;
  makerOrderId: string;
  takerOrderId: string;
  makerId: string;
  takerId: string;
  filledQty: number,
  askedQty: number;
  price: number;
  asset: BalanceKey;
  type: fillType;
  side: orderSide;
  createdAt: Date;
};

export type REDIS_QUEUE_TYPE = "http-to-orderbook-queue" | "orderbook-to-db-queue" | "orderbook-to-ws-queue"
