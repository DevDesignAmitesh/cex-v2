import { prisma } from "@repo/db/db";
import { redisManager } from "@repo/redis/redis";
import type { RedisDbQueueData } from "@repo/common/common"

async function main() {
  for (;;) {
    const response = await redisManager.getDataFromQueue("orderbook-to-db-queue");
    if (!response) continue;

    console.log("response", response);
    
    const parsedResponse = JSON.parse(response.element) as RedisDbQueueData;
  
    console.log("parsedResponse", parsedResponse)
    
    if (parsedResponse.type === "cancel_order") {
      const { userId, orderId } = parsedResponse.data;

      await prisma.order.update({
        where: { id: orderId, userId },
        data: { status: "CANCELLED" }
      })
    }

    if (parsedResponse.type === "create_order") {
      const { side, type, userId, price, qty, status, filledQty, fillType } = parsedResponse.data;
      
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId,
            filledQty,
            market: "SOL",
            price,
            qty,
            side,
            status,
            type,
          }
        })
  
        await tx.fill.create({
          data: {
            qty,
            side,
            type: fillType,
            orderId: order.id
          }
        })
      })    
    }
  
  }
}


main();
