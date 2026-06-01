import { WebSocketServer, WebSocket } from "ws";
import { redisManager } from "@repo/redis/redis";
import { ORDER_ENGINE_STREAM_CONFIGS, type RedisWsQueueData } from "@repo/common/common";
import { wsUserManager } from "./wsUserManager";

async function main() {
  for (;;) {
    const res = await redisManager.getFromStream(
      ORDER_ENGINE_STREAM_CONFIGS.group_name,
      ORDER_ENGINE_STREAM_CONFIGS.consumer_grp,
      ORDER_ENGINE_STREAM_CONFIGS.stream,
    );

    console.log("response", res?.messages);
    // const response = await redisManager.getDataFromQueue("orderbook-to-ws-queue");
  
    // if (!response) continue;
  
    // const parsedResponse = JSON.parse(response?.element) as RedisWsQueueData

    // if (parsedResponse.type === "order_book") {
    //   redisManager.publishData2("AXIS", parsedResponse)
    //   // wsUserManager.broadcast(parsedResponse.data);
    // }
  } 
}


const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket) => {

  wsUserManager.add(ws);
  
  ws.on("message", (data) => {
    const parsedResponse = JSON.parse(data.toString());

    if (parsedResponse.type === "SUBSCRIBE") {
      // symbol = "AXIS" | "HDFC"
      const { symbol } = parsedResponse.payload;
      redisManager.subscribe("AXIS");
    }
  })

});

main();