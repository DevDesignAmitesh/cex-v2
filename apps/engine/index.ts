import type { EngineResponse, RedisQueueData } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import { engineStore } from "./engine-store";

for (;;) {
  const response = await redisManager.getDataFromQueue();
  if (!response) continue;

  const parsedResponse = JSON.parse(response.element) as RedisQueueData;

  const { clientId } = parsedResponse;

  let engineResponse: EngineResponse = {
    clientId,
    ok: false,
  };

  if (parsedResponse.type === "create_order") {
    const { ioc, side, symbol, type, userId, price, qty } = parsedResponse.data;
  }

  if (parsedResponse.type === "cancel_order") {
    const { orderId, userId } = parsedResponse.data;
    const res = engineStore.deleteOrder(userId, orderId);

    engineResponse = {
      clientId,
      ok: res ? true : false,
      data: res ? {
        message: "Order deleted successfully",
        data: undefined
      } : undefined,
      error: !res ? "Order with the given Id not found" : undefined,
    };
  }

  if (parsedResponse.type === "get_depth") {
    const { symbol } = parsedResponse.data;
    const res = engineStore.getSymbolDepth(symbol);

    engineResponse = {
      clientId,
      ok: res ? true : false,
      data: res ? {
        message: "depth found successfully",
        data: res
      } : undefined,
      error: !res ? "Depth with the given symbol not found" : undefined,
    };
  }

  if (parsedResponse.type === "get_fills") {
    const { userId } = parsedResponse.data;
    const res = engineStore.getFills(userId);

    engineResponse = {
      clientId,
      ok: res ? true : false,
      data: res ? {
        message: "Fills found successfully",
        data: res
      } : undefined,
      error: !res ? "Fills for the given userId not found" : undefined,
    };
  }

  if (parsedResponse.type === "get_order") {
    const { orderId, userId } = parsedResponse.data;
    const res = engineStore.getOrder(orderId, userId);

    engineResponse = {
      clientId,
      ok: res ? true : false,
      data: res ? {
        message: "Order found successfully",
        data: res
      } : undefined,
      error: !res ? "Order with the given userId and orderId not found" : undefined,
    };
  }

  if (parsedResponse.type === "get_orders") {
    const { userId, open } = parsedResponse.data;
    const res = engineStore.getOrders(userId, open);

    engineResponse = {
      clientId,
      ok: res.length ? true : false,
      data: res.length ? {
        message: "Orders found successfully",
        data: res
      } : undefined,
      error: !res.length ? "Orders for the given userId not found" : undefined,
    };
  }

  if (parsedResponse.type === "get_user_balance") {
    const { userId } = parsedResponse.data;
    const res = engineStore.getUserBalance(userId);

    engineResponse = {
      clientId,
      ok: res ? true : false,
      data: res ? {
        message: "User balance found successfully",
        data: res
      } : undefined,
      error: !res ? "User balane for the given userId not found" : undefined,
    };
  }

  redisManager.publishData(clientId, engineResponse);
}
