import type { RedisQueueData } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";

for (;;) {
  const response = await redisManager.getDataFromQueue();
  if (!response) continue;

  const parsedResponse = JSON.parse(response.element) as RedisQueueData;

  if (parsedResponse.type === "create_order") {
  }

  redisManager.publishData(parsedResponse.clientId, {
    clientId: parsedResponse.clientId,
    ok: true,
    data,
    error,
  });
}
