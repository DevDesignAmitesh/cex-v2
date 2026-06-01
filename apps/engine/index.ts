import { ORDER_ENGINE_STREAM_CONFIGS, type RedisQueueData } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import { engineRequestHandler } from "./lib";
import { checkLiquidation } from "./utils";

// async function main() {
//   for (;;) {
//     let clientId = "";
    
//     try {    
//       const response = await redisManager.getDataFromQueue("http-to-orderbook-queue");
//       if (!response) continue;
  
//       console.log("response in the engine", response);
      
//       const parsedResponse = JSON.parse(response.element) as RedisQueueData;  

//       clientId = parsedResponse.clientId

//       const engineResponse = engineRequestHandler(parsedResponse);
      
//       await redisManager.publishData(engineResponse.clientId, engineResponse);
//     } catch (e: unknown) {
//       console.log("error in the engine", e)
//       await redisManager.publishData(clientId, {
//         clientId,
//         ok: false,
//         error: "something went wrong"
//       });
//     }
//   }
// }


async function main() {
  for (;;) {
    let responseStream = "";
    let clientId = "";

    try {  
      const res = await redisManager.getFromStream(
        ORDER_ENGINE_STREAM_CONFIGS.group_name,
        ORDER_ENGINE_STREAM_CONFIGS.consumer_grp,
        ORDER_ENGINE_STREAM_CONFIGS.stream,
      );
  
       if (!res) continue;    
    
      console.log("res.messages", res.messages)
      
      const parsedResponse = JSON.parse(res.messages[0]!.message.data ?? "{}") as RedisQueueData;
      // mostly here we need to add types in this
      // TODO: add types here and handle the shitss
      console.log("parsedResponse ", parsedResponse);

      const engineResponse = engineRequestHandler(parsedResponse);

      responseStream = parsedResponse.responseStream;
      
      await redisManager.addToStream(parsedResponse.responseStream, {
        type: "from-order-engine",
        data: engineResponse
      });
    } catch (e) {
      console.log("error in the engine/index.ts file")
      await redisManager.addToStream(responseStream, {
        type: "from-order-engine",
        data: {
          clientId,
          ok: false,
          error: "Something went wrong"
        }
      });
    }
  }
}


main();
<<<<<<< HEAD
// setInterval(checkLiquidation, 3 * 1000);
=======
setInterval(checkLiquidation, 3 * 1000);
setInterval(updatePnl, 3 * 1000);
>>>>>>> parent of 4eae45d (done without redis-streams)
