import type { EngineResponse, RedisQueueData } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import { engineRequestHandler } from "./lib";

async function main() {
  for (;;) {
    try {    
      const response = await redisManager.getDataFromQueue("http-to-orderbook-queue");
      if (!response) continue;
  
      const parsedResponse = JSON.parse(response.element) as RedisQueueData;  
      
      const engineResponse = engineRequestHandler(parsedResponse);
      
      await redisManager.publishData(engineResponse.clientId, engineResponse);
    } catch (e: unknown) {
      const engineResponse = e as EngineResponse;
      await redisManager.publishData(engineResponse.clientId, engineResponse);
    }
  }
}

main()
