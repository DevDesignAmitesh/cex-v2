import { WebSocketServer, WebSocket } from "ws";
import { redisManager } from "@repo/redis/redis";
import type { RedisWsQueueData } from "@repo/common/common";
import { wsUserManager } from "./wsUserManager";

async function main() {
  for (;;) {
    const response = await redisManager.getDataFromQueue("orderbook-to-ws-queue");
    console.log("response", response);
  
    if (!response) continue;
  
    const parsedResponse = JSON.parse(response?.element) as RedisWsQueueData  

    if (parsedResponse.type === "order_book") {
      redisManager.publishData2("AXIS", parsedResponse)
      // wsUserManager.broadcast(parsedResponse.data);
    }
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