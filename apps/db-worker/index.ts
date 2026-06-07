import { prisma } from "@repo/db/db";
import { redisManager } from "@repo/redis/redis";
import { COMMON_STREAM_CONFIGS, type RedisDbQueueData } from "@repo/common/common"

async function main() {
  try {
    for (;;) {
      // const response = await redisManager.getDataFromQueue("orderbook-to-db-queue");
      // if (!response) continue;

      const res = await redisManager.getFromSingleStream(
        COMMON_STREAM_CONFIGS.stream,
      );
      
      if (!res) continue;
      
      const parsedResponse = JSON.parse(res.messages[0]!.message.data ?? "{}") as RedisDbQueueData;
      
      if (parsedResponse.type === "cancel_order") {
        const { userId, orderId } = parsedResponse.data;
  
        await prisma.order.update({
          where: { id: orderId, userId },
          data: { status: "CANCELLED" }
        })
      }
  
      if (parsedResponse.type === "create_order_fills_position") {
        const { order, fills, positions } = parsedResponse.data;
        
        prisma.$transaction(async (tx) => {
          const { 
            filledQty, 
            id, 
            market, 
            price, 
            qty, 
            side, 
            status, 
            type, 
            userId 
          } = order;

          await tx.order.upsert({
            where: { id, userId },
            update: {
              filledQty,
              price,
              status,
            },
            create: {
              id,
              userId,
              filledQty,
              price,
              market,
              qty,
              side,
              status,
              type,
            },
          })
  
          for (const fls of fills) {
            const { 
              askedQty, 
              asset, 
              filledQty, 
              id, 
              makerId, 
              makerOrderId, 
              price, 
              side, 
              takerId, 
              takerOrderId, 
              type 
            } = fls;
            
            await tx.fill.create({
              data: {
                id,
                askedQty,
                makerId,
                takerId,
                makerOrderId,
                takerOrderId,
                price,
                filledQty,
                asset,
                side,
                type,
              }
            })
          }

          for (const pos of positions) {
            const { 
              averagePrice,
              isProfit,
              liquidationPrice,
              margin,
              market,
              orderId,
              pnl,
              qty,
              type,
              userId,
            } = pos;
            
            await tx.position.create({
              data: {
                averagePrice,
                isProfit,
                liquidationPrice,
                margin,
                market,
                orderId,
                pnl,
                qty,
                type,
                userId,
              }
            })
          }
        })
        
      }
    }
  } catch (e) {
    console.log("error in db worker", e);
  }
}


main();
