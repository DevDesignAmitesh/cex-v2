import type { EngineResponse, RedisQueueData } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import { engineStore } from "./engine-store";

try {
  for (;;) {
    console.log("lgggyee laudee")
    const response = await redisManager.getDataFromQueue();
    if (!response) continue;

    const parsedResponse = JSON.parse(response.element) as RedisQueueData;

    const { clientId } = parsedResponse;

    let engineResponse: EngineResponse = {
      clientId,
      ok: false,
      error: "meoww",
    };

    if (parsedResponse.type === "create_order") {
      const { side, symbol, type, userId, price, qty } = parsedResponse.data;

      if (type === "LIMIT") {
        if (price === undefined || qty === undefined) {
          await redisManager.publishData(clientId, {
            clientId,
            ok: false,
            error: "Price and quantity both should be defined.",
          });
          continue;
        }
        
        console.log("1")
        
        const isUserHaveBalance = engineStore.gettingAndLockingUserBalance(
          userId,
          price,
          qty,
          side,
        );
        
        if (!isUserHaveBalance) {
          await redisManager.publishData(clientId, {
            clientId,
            ok: false,
            error: "Insufficient balance.",
          });
          continue;
        }

        const availablePrice = engineStore.checkAvailablePriceInOrderBook(
          price,
          "AXIS",
          side === "BUY" ? "asks" : "bids",
        );

        console.log("2")
        
        if (!availablePrice) {
          // push in the order book
          engineStore.addNewAsksOrBidsInOrderBook(
            side === "SELL" ? "asks" : "bids",
            price,
            "AXIS",
            qty,
          );

          redisManager.publishData(clientId, {
            clientId,
            ok: true,
            data: {
              message: "Order added in the order book",
              data: undefined,
            },
          });
          console.log("here ")
          continue;
        }

        // quantiy thing
        const { keyPrice, qty: keyQty } = availablePrice!;

        if (keyQty > qty) {
          console.log("3")
          if (side === "BUY") {
            const userProfit = price - keyPrice;
            const finalPrice = price - userProfit;
            const res = engineStore.completeLimitOrder(
              side,
              keyPrice,
              qty,
              userId,
              finalPrice,
              price,
            );

            engineStore.resetLockBalalnceOfUser(userId, side);
            engineStore.deductTotalBalalnceOfUser(
              userId,
              side,
              finalPrice,
              qty,
            );

            redisManager.publishData(clientId, {
              clientId,
              ok: true,
              data: {
                message: "Order swapped successfully",
                data: {
                  ...res,
                  totalPrice: finalPrice * qty,
                },
              },
            });
            continue;
          }

          console.log("4")
          if (side === "SELL") {
            const userProfit = keyPrice - price;
            const finalPrice = price + userProfit;
            const res = engineStore.completeLimitOrder(
              side,
              keyPrice,
              qty,
              userId,
              finalPrice,
              price,
            );

            engineStore.resetLockBalalnceOfUser(userId, side);
            engineStore.deductTotalBalalnceOfUser(
              userId,
              side,
              finalPrice,
              qty,
            );

            redisManager.publishData(clientId, {
              clientId,
              ok: true,
              data: {
                message: "Order swapped successfully",
                data: {
                  ...res,
                  totalPrice: finalPrice * qty,
                },
              },
            });
            continue;
          }
        }
      }
    }

    if (parsedResponse.type === "cancel_order") {
      const { orderId, userId } = parsedResponse.data;
      const res = engineStore.deleteOrder(userId, orderId);

      engineResponse = {
        clientId,
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

    if (parsedResponse.type === "get_depth") {
      const { symbol } = parsedResponse.data;
      const res = engineStore.getSymbolDepth(symbol);

      engineResponse = {
        clientId,
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

    if (parsedResponse.type === "get_fills") {
      const { userId } = parsedResponse.data;
      const res = engineStore.getFills(userId);

      engineResponse = {
        clientId,
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

    if (parsedResponse.type === "get_order") {
      const { orderId, userId } = parsedResponse.data;
      const res = engineStore.getOrder(orderId, userId);

      engineResponse = {
        clientId,
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
      };
    }

    if (parsedResponse.type === "get_orders") {
      const { userId, open } = parsedResponse.data;
      const res = engineStore.getOrders(userId, open);

      engineResponse = {
        clientId,
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
      };
    }

    if (parsedResponse.type === "get_user_balance") {
      const { userId } = parsedResponse.data;
      const res = engineStore.getUserBalance(userId);

      engineResponse = {
        clientId,
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
      };
    }

    console.log("engineResponse ", engineResponse);
    // await redisManager.publishData(clientId, engineResponse);
  }
} catch (e: unknown) {
  console.log("error ", e);
  const engineResponse = e as EngineResponse;
  console.log("engineResponse", engineResponse);
  await redisManager.publishData(engineResponse.clientId, engineResponse);
}
