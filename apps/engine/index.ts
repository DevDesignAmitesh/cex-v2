import type { EngineResponse, RedisQueueData } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import { engineRequestHandler } from "./lib";

async function main() {
  for (;;) {
    try {    
      const response = await redisManager.getDataFromQueue();
      if (!response) continue;
  
      console.log("response", response)
      
      const parsedResponse = JSON.parse(response.element) as RedisQueueData;
  
      const engineResponse = engineRequestHandler(parsedResponse);
      console.log("engineResponse ", engineResponse);

      await redisManager.publishData(engineResponse.clientId, engineResponse);
    } catch (e: unknown) {
      console.log("error ", e);
      const engineResponse = e as EngineResponse;
      console.log("engine error response", engineResponse);
      await redisManager.publishData(engineResponse.clientId, engineResponse);
    }
  }
}

main()