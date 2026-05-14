import type { EngineResponse, RedisQueueData } from "@repo/common/common";
import { engineStore } from "./engine-store";

export function createOrder(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "create_order") return {
    clientId: parsedResponse.clientId,
    ok: false
  }

  const { side, symbol, type, userId, price, qty } = parsedResponse.data;

  if (type === "LIMIT") {
    if (price === undefined || qty === undefined) {
      return {
        clientId: parsedResponse.clientId,
        ok: false,
        error: "Price and quantity both should be defined.",
      };
    }

    const isUserHaveBalance = engineStore.gettingAndLockingUserBalance(
      userId,
      price,
      qty,
      side,
    );

    console.log("isUserHaveBalance", isUserHaveBalance);

    if (!isUserHaveBalance) {
      return {
        clientId: parsedResponse.clientId,
        ok: false,
        error: "Insufficient balance.",
      };
    }

    const availablePrice = engineStore.checkAvailablePriceInOrderBook(
      price,
      "AXIS",
      side === "BUY" ? "asks" : "bids",
    );

    console.log("availablePrice", availablePrice);

    if (!availablePrice) {
      // push in the order book
      engineStore.addNewAsksOrBidsInOrderBook(
        side === "SELL" ? "asks" : "bids",
        price,
        userId,
        "AXIS",
        qty,
      );

      return {
        clientId: parsedResponse.clientId,
        ok: true,
        data: {
          message: "Order added in the order book",
          data: undefined,
        },
      };
    }

    // quantiy thing
    const { keyPrice, qty: keyQty, orderBookKey } = availablePrice;

    if (keyQty >= qty) {
      if (side === "BUY") {
        const userProfit = price - Number(keyPrice);
        const finalPrice = price - userProfit;
        const res = engineStore.completeLimitOrder(
          side,
          orderBookKey,
          qty,
          userId,
          finalPrice,
        );

        engineStore.resetLockBalalnceOfUser(userId, side);
        engineStore.deductTotalBalalnceOfUser(
          userId,
          side,
          finalPrice,
          qty,
        );

        return {
          clientId: parsedResponse.clientId,
          ok: true,
          data: {
            message: "Order swapped successfully",
            data: {
              ...res,
              totalPrice: finalPrice * qty,
            },
          },
        };
      }

      if (side === "SELL") {
        const userProfit = Number(keyPrice) - price;
        const finalPrice = price + userProfit;
        const res = engineStore.completeLimitOrder(
          side,
          orderBookKey,
          qty,
          userId,
          finalPrice,
        );

        engineStore.resetLockBalalnceOfUser(userId, side);
        engineStore.deductTotalBalalnceOfUser(
          userId,
          side,
          finalPrice,
          qty,
        );

        return {
          clientId: parsedResponse.clientId,
          ok: true,
          data: {
            message: "Order swapped successfully",
            data: {
              ...res,
              totalPrice: finalPrice * qty,
            },
          },
        };
      }
    }
  }

  return {
    clientId: parsedResponse.clientId,
    ok: false
  }
}

export function deleteOrder(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "cancel_order") return {
    clientId: parsedResponse.clientId,
    ok: false
  };

  const { orderId, userId } = parsedResponse.data;
  const res = engineStore.deleteOrder(userId, orderId);

  return {
    clientId: parsedResponse.clientId,
    ok: res ? true : false,
    data: res
      ? {
          message: "Order deleted successfully",
          data: undefined,
        }
      : undefined,
    error: !res ? "Order with the given Id not found" : undefined,
  };
}

export function getDepth(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "get_depth") return {
    ok: false,
    clientId: parsedResponse.clientId
  }
  
  const { symbol } = parsedResponse.data;
  const res = engineStore.getSymbolDepth(symbol);

  return {
    clientId: parsedResponse.clientId,
    ok: res ? true : false,
    data: res
      ? {
          message: "depth found successfully",
          data: res,
        }
      : undefined,
    error: !res ? "Depth with the given symbol not found" : undefined,
  };
}


export function getFills(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "get_fills") return {
    ok: false,
    clientId: parsedResponse.clientId
  }

  const { userId } = parsedResponse.data;
  const res = engineStore.getFills(userId);

  return {
    clientId: parsedResponse.clientId,
    ok: res ? true : false,
    data: res
      ? {
          message: "Fills found successfully",
          data: res,
        }
      : undefined,
    error: !res ? "Fills for the given userId not found" : undefined,
  };  
}


export function getOrder(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "get_order") return {
    ok: false,
    clientId: parsedResponse.clientId
  }

  const { orderId, userId } = parsedResponse.data;
  const res = engineStore.getOrder(orderId, userId);

  return {
    clientId: parsedResponse.clientId,
    ok: res ? true : false,
    data: res
      ? {
          message: "Order found successfully",
          data: res,
        }
      : undefined,
    error: !res
      ? "Order with the given userId and orderId not found"
      : undefined,
  }
  
}

export function getOrders(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "get_orders") return {
    ok: false,
    clientId: parsedResponse.clientId
  }
  
  const { userId, open } = parsedResponse.data;
  const res = engineStore.getOrders(userId, open);

  return {
    clientId: parsedResponse.clientId,
    ok: res.length ? true : false,
    data: res.length
      ? {
          message: "Orders found successfully",
          data: res,
        }
      : undefined,
    error: !res.length
      ? "Orders for the given userId not found"
      : undefined,
  }
 
}


export function getUserBalance(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "get_user_balance") return {
    ok: false,
    clientId: parsedResponse.clientId
  }

  
  const { userId } = parsedResponse.data;
  const res = engineStore.getUserBalance(userId);

  return {
    clientId: parsedResponse.clientId,
    ok: res ? true : false,
    data: res
      ? {
          message: "User balance found successfully",
          data: res,
        }
      : undefined,
    error: !res
      ? "User balance with the given userId not found"
      : undefined,
  }

}

