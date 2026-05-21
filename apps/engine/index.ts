import type { EngineResponse, RedisQueueData } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import { engineRequestHandler } from "./lib";

async function main() {
  for (;;) {
    let clientId = "";
    
    try {    
      const response = await redisManager.getDataFromQueue("http-to-orderbook-queue");
      if (!response) continue;
  
      console.log("response in the engine", response);
      
      const parsedResponse = JSON.parse(response.element) as RedisQueueData;  

      clientId = parsedResponse.clientId

      const engineResponse = engineRequestHandler(parsedResponse);
      
      await redisManager.publishData(engineResponse.clientId, engineResponse);
    } catch (e: unknown) {
      console.log("error in the engine", e)
      await redisManager.publishData(clientId, {
        clientId,
        ok: false,
        error: e ? `${e}` : "something went wrong"
      });
    }
  }
}

main();