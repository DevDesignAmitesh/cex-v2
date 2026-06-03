import type { EngineResponse, RedisQueueData } from "@repo/common/common";
import { createOrder, deleteOrder, getDepth, getFills, getOrder, getOrders, getTrades, getUserBalance } from "./utils";

export function engineRequestHandler(
  parsedResponse: RedisQueueData,
): EngineResponse {
  let engineResponse: EngineResponse = {
    clientId: "",
    ok: false
  } 
  
  if (parsedResponse.type === "create_order") { 
    engineResponse = createOrder(parsedResponse);
  }

  if (parsedResponse.type === "cancel_order") {
    engineResponse = deleteOrder(parsedResponse);
  }

  if (parsedResponse.type === "get_depth") {
    engineResponse = getDepth(parsedResponse);
  }

  if (parsedResponse.type === "get_fills") {
    engineResponse = getFills(parsedResponse);
  }

  if (parsedResponse.type === "get_order") {
    engineResponse = getOrder(parsedResponse);
  }

  if (parsedResponse.type === "get_orders") {
    engineResponse = getOrders(parsedResponse);
  }

  if (parsedResponse.type === "get_user_balance") {
    engineResponse = getUserBalance(parsedResponse);
  }
  
  if (parsedResponse.type === "get_trades") {
    engineResponse = getTrades(parsedResponse);
  }

  return engineResponse;
}
