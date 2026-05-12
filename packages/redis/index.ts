import { createClient, type RedisClientType } from "redis";
import { type OrderEngineData, type RedisQueueData } from "@repo/common/common";
import { REDIS_QUEUE } from "./utils";

class RedisManager {
  private static instance: RedisManager;
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private client: RedisClientType;

  constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
    this.client = createClient();

    this.initClients();
  }

  private initClients = async () => {
    try {
      await this.publisher.connect();
      await this.subscriber.connect();
      await this.client.connect();
    } catch (e) {
      console.log("error connecting to redis ", e);
    }
  };

  pushToQueue = async (toSend: RedisQueueData) => {
    this.publisher.lPush(toSend.type, JSON.stringify(toSend.data));
  };

  waitForData = async (data: RedisQueueData) => {
    return new Promise<OrderEngineData>((res) => {
      const clientId = crypto.randomUUID();            
      this.subscriber.subscribe(clientId, (message) => {
        this.subscriber.unsubscribe(clientId);
        res(JSON.parse(message))
      });
      this.publisher.lPush(REDIS_QUEUE, JSON.stringify({clientId, data}));
    })
  };

  static getInstance = (): RedisManager => {
    if (!RedisManager.instance) RedisManager.instance = new RedisManager();
    return RedisManager.instance;
  };
}

export const redisManager = RedisManager.getInstance();
