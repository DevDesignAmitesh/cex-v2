import { WebSocketServer, WebSocket } from "ws";
import { redisManager } from "@repo/redis/redis";
import { COMMON_STREAM_CONFIGS, type RedisDbQueueData, type RedisWsQueueData } from "@repo/common/common";
import { wsUserManager } from "./wsUserManager";

async function main() {
  for (;;) {
    const res = await redisManager.getFromStream(
      COMMON_STREAM_CONFIGS.group_name,
      COMMON_STREAM_CONFIGS.consumer_grp,
      COMMON_STREAM_CONFIGS.stream,
    );

    if (!res) continue;
  
    const parsedResponse = JSON.parse(res.messages[0]!.message.data ?? "{}") as RedisDbQueueData;

    console.log("parsedResponse", parsedResponse)

    redisManager.publishData2("AXIS", parsedResponse)
  } 
}


const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket) => {

  wsUserManager.add(ws);
  
  ws.on("message", (data) => {
    const parsedResponse = JSON.parse(data.toString());

    console.log("client message", parsedResponse);
    
    if (parsedResponse.type === "SUBSCRIBE") {
      // symbol = "AXIS" | "HDFC"
      const { symbol } = parsedResponse.payload;
      redisManager.subscribe("AXIS");
    }
  })

});

main();