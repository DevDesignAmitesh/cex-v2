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
      
      console.log(parsedResponse)
      
      if (parsedResponse.type === "cancel_order") {
        const { userId, orderId } = parsedResponse.data;
  
        await prisma.order.update({
          where: { id: orderId, userId },
          data: { status: "CANCELLED" }
        })
      }
  
      if (parsedResponse.type === "create_order_fills_position") {
        const { orders, fills, positions } = parsedResponse.data;
        
        // TODO: find a way to optimize it (as its doing one by one)
        for (const order of orders) {
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
  
          await prisma.order.upsert({
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
        }

        await prisma.fill.createMany({
          data: fills
        });

        await prisma.position.createMany({
          data: positions
        });        
      }
    }
  } catch (e) {
    console.log("error in db worker", e);
  }
}


main();
