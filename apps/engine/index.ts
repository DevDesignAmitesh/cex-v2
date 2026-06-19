import {
  ORDER_ENGINE_STREAM_CONFIGS,
  type RedisQueueData,
} from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import { engineRequestHandler } from "./lib";
import { checkLiquidation } from "./utils";

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

      const parsedResponse = JSON.parse(
        res.messages[0]!.message.data ?? "{}",
      ) as RedisQueueData;

      const engineResponse = engineRequestHandler(parsedResponse);

      responseStream = parsedResponse.responseStream;

      const waiting_steam_message_id = await redisManager.addToStream(parsedResponse.responseStream, {
        type: "engine-to-http",
        data: engineResponse,
      });
      
      await redisManager.acknowledgeMent(
        parsedResponse.responseStream,
        parsedResponse.responseGroup,
        waiting_steam_message_id
      );
    } catch (e) {
      await redisManager.addToStream(responseStream, {
        type: "engine-to-http",
        data: {
          clientId,
          ok: false,
          error: "Something went wrong",
        },
      });
    }
  }
}

main();
// setInterval(checkLiquidation, 3 * 1000);
