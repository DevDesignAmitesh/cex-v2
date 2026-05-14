import type { EngineResponse, RedisQueueData } from "@repo/common/common";
import { engineStore } from "./engine-store";

export function createOrder(parsedResponse: RedisQueueData): EngineResponse {
  if (parsedResponse.type !== "create_order") return {
    clientId: parsedResponse.clientId,
    ok: false,
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

    const res = engineStore.beforeOrder(parsedResponse);
    
    if (!res.ok) return res
    if (res.ok && !res.data?.data) return res
    
    const { keyPrice, qty: keyQty, orderBookKey } = res.data?.data! as {
      keyPrice: number,
      qty: number,
      orderBookKey: string
    }

    if (keyQty >= qty) {
      if (side === "BUY") {
        const userProfit = price - Number(keyPrice);
        const finalPrice = price - userProfit;
        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          qty,
          userId,
          finalPrice,
          type
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
        const userProfit = keyPrice - price;
        const finalPrice = price + userProfit;
        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          qty,
          userId,
          finalPrice,
          type,
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
    } else {
      const leftQty = qty - keyQty;
      const finalPrice = keyQty * keyPrice

      console.log("leftqty", leftQty);
      
      const firstIterationOrder = engineStore.completeOrder(
        side,
        orderBookKey,
        qty,
        userId,
        finalPrice,
        type
      );

      engineStore.resetLockBalalnceOfUser(userId, side);
      engineStore.deductTotalBalalnceOfUser(
        userId,
        side,
        finalPrice,
        qty,
      );

      if (leftQty !== 0) {
        const beforeOrderResponse = engineStore.beforeOrder(parsedResponse, firstIterationOrder.orderId);
        
        if (!beforeOrderResponse.ok) return beforeOrderResponse

        if (beforeOrderResponse.ok && !beforeOrderResponse.data?.data) return beforeOrderResponse

        const { keyPrice, qty: keyQty, orderBookKey } = beforeOrderResponse.data?.data! as {
          keyPrice: number,
          qty: number,
          orderBookKey: string
        };
        
        const finalPrice = leftQty * keyPrice;

        const res = engineStore.completeOrder(
          side,
          orderBookKey,
          leftQty,
          userId,
          finalPrice,
          type,
          firstIterationOrder.orderId
        );

        engineStore.resetLockBalalnceOfUser(userId, side);
        engineStore.deductTotalBalalnceOfUser(
          userId,
          side,
          finalPrice,
          leftQty,
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
      

      return {
        clientId: parsedResponse.clientId,
        ok: true,
        data: {
          message: "Order partially filled successfully",
          data: {
            ...firstIterationOrder,
            totalPrice: finalPrice * qty,
          },
        },
      };
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

