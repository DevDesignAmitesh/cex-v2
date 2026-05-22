import type { EngineResponse, RedisQueueData, UserInOrderBook } from "@repo/common/common";
import { engineStore } from "./engine-store";
import { redisManager } from "@repo/redis/redis";

export function createOrder(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "create_order") return {
    clientId: parsedResponse.clientId,
    ok: false,
    error: "invalid type"
  }

  const { side, symbol, type, userId, price, qty, orderId } = parsedResponse.data;

  if (type === "LIMIT") {
    // for limit we need both price and qty (conceptual)
    if (price === undefined || qty === undefined) {
      return {
        clientId: parsedResponse.clientId,
        ok: false,
        error: "Price and quantity both should be defined.",
      };
    }

    // things like checking balances, locking amount and finding best price
    const beforeOrderResponseOne = engineStore.beforeOrder(parsedResponse);
    
    if (beforeOrderResponseOne.type === "ERROR" || beforeOrderResponseOne.type === "ORDER_IN_ORDERBOOK") {
      return beforeOrderResponseOne
    }
    
    const { keyPrice, qty: keyQty, orderBookKey } = beforeOrderResponseOne.data?.data! as {
      keyPrice: number,
      qty: number,
      orderBookKey: number
    }
    
    if (keyQty >= qty) {
      const users = engineStore.getUserInvolvedInSwap(orderBookKey, qty, side) ?? []

      console.log("users after swap", users)
      
      if (side === "BUY") {
        /**
         * here we are handling that the key's qty is greater than user's ask so we will give all of that
         * userProfit = price - keyPrice (keyPrice can be less also as we are finding best price)
         * 
         * so if price = 100
         * and keyPrice = 80
         * userProfit = 100 - 80 = 20
         * finalPrice = price - userProfit (user have to pay this much only)
         */
        const userProfit = price - keyPrice;
        const finalPrice = price - userProfit;

        // main fn for completing the shit
        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          qty,
          qty,
          userId,
          finalPrice,
          type,
          users,
          orderId
        );
        
        return {
          clientId: parsedResponse.clientId,
          ok: true,
          data: {
            message: "Order swapped successfully",
            data: res,
          },
        };
      }

      if (side === "SELL") {
        const userProfit = keyPrice - price;
        const finalPrice = price + userProfit;
        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          qty,
          qty,
          userId,
          finalPrice,
          type,
          users,
          orderId
        );
        
        return {
          clientId: parsedResponse.clientId,
          ok: true,
          data: {
            message: "Order swapped successfully",
            data: res
          },
        };
      }
    } else {
      const users = engineStore.getUserInvolvedInSwap(orderBookKey, keyQty, side) ?? []
      
      if (side === "BUY") {
        const leftQty = qty - keyQty
        const userProfit = price - keyPrice;
        const finalPrice = price - userProfit;
        
        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          qty,
          keyQty, 
          userId,
          finalPrice,
          type,
          users,
          orderId
        );

        if (leftQty !== 0) {
          createOrder({
            ...parsedResponse,
            data: { ...parsedResponse.data, qty: leftQty }
          })
        }
        
        return {
          clientId: parsedResponse.clientId,
          ok: true,
          data: {
            message: "Order swapped successfully",
            data: res
          },
        };
      }

      if (side === "SELL") {
        const leftQty = qty - keyQty;
        const userProfit = keyPrice - price;
        const finalPrice = price + userProfit;
        
        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          qty,
          leftQty,
          userId,
          finalPrice,
          type,
          users,
          orderId
        );

        if (leftQty !== 0) {
          createOrder({
            ...parsedResponse,
            data: { ...parsedResponse.data, qty: leftQty }
          })
        }
                
        return {
          clientId: parsedResponse.clientId,
          ok: true,
          data: {
            message: "Order swapped successfully",
            data: res
          },
        };
      }
    }
  }

  if (type === "MARKET") {
  
    if (price === undefined && qty === undefined) {
      return {
        clientId: parsedResponse.clientId,
        ok: false,
        error: "Price and quantity both should be defined.",
      };
    }

    let calculatedPrice = 0;
    let calculatedQty = 0;
    
    if (price) {
      calculatedQty = price / engineStore.getLastTradingPrice()
      calculatedPrice = price
    } else if (qty) {
      calculatedPrice = qty * engineStore.getLastTradingPrice()
      calculatedQty = qty
    }

    const beforeOrderResponseOne = engineStore.beforeOrder({
      ...parsedResponse,
      data: { ...parsedResponse.data, price: calculatedPrice, qty: calculatedQty }
    });
    
    if (!beforeOrderResponseOne.ok) return beforeOrderResponseOne
    if (beforeOrderResponseOne.ok && !beforeOrderResponseOne.data?.data) return beforeOrderResponseOne
    
    const { keyPrice, qty: keyQty, orderBookKey } = beforeOrderResponseOne.data?.data! as {
      keyPrice: number,
      qty: number,
      orderBookKey: number
    }
    
    if (keyQty >= qty!) {
      const users = engineStore.getUserInvolvedInSwap(orderBookKey, calculatedQty, side) ?? []

      if (side === "BUY") {
        const userProfit = calculatedPrice - keyPrice;
        const finalPrice = calculatedPrice - userProfit;
        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          calculatedQty,
          calculatedQty,
          userId,
          finalPrice,
          type,
          users,
          orderId
        );

        return {
          clientId: parsedResponse.clientId,
          ok: true,
          data: {
            message: "Order swapped successfully",
            data: res
          },
        };
      }

      if (side === "SELL") {
        const userProfit = keyPrice - calculatedPrice;
        const finalPrice = calculatedPrice + userProfit;
        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          calculatedQty,
          calculatedQty,
          userId,
          finalPrice,
          type,
          users,
          orderId
        );
        
        return {
          clientId: parsedResponse.clientId,
          ok: true,
          data: {
            message: "Order swapped successfully",
            data: res
          },
        };
      }

    } else {
      return {
        clientId: parsedResponse.clientId,
        ok: false,
        error: "No matching orders found"
      }
    }
  } 

  return {
    clientId: parsedResponse.clientId,
    ok: false,
    error: "meowww"
  }
}

export function deleteOrder(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "cancel_order") return {
    clientId: parsedResponse.clientId,
    ok: false
  };

  const { orderId, userId } = parsedResponse.data;
  const res = engineStore.deleteOrder(userId, orderId);
  redisManager.pushDataInOrderQueue(parsedResponse, "orderbook-to-db-queue")
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

