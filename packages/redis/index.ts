import { createClient, type RedisClientType } from "redis";
import { type EngineResponse, type REDIS_QUEUE_TYPE, type RedisDbQueueData, type RedisQueueData, type RedisWsQueueData } from "@repo/common/common";
import { wsUserManager } from "@repo/ws/ws";

class RedisManager {
  private static instance: RedisManager;
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private client: RedisClientType;
  public static REDIS_QUEUE = `http-orderbook-queue-${crypto.randomUUID()}`;

  constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
    this.client = createClient();

    this.initClients();
  }

  private initClients = async () => {
    try {
      await Promise.all([
        this.publisher.connect(),
        this.subscriber.connect(),
        this.client.connect(),
      ]);
    } catch (e) {
      console.log("error connecting to redis ", e);
    }
  };

  waitForData = async (data: RedisQueueData, REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
    console.log("queue in wait ", REDIS_QUEUE);
    
    return new Promise<EngineResponse>((res) => {
      this.subscriber.subscribe(data.clientId, (message) => {
        this.subscriber.unsubscribe(data.clientId);
        res(JSON.parse(message));
      });
      this.publisher.lPush(REDIS_QUEUE, JSON.stringify(data));
    });
  };

  pushDataInQueue = (data: RedisQueueData, REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
    this.publisher.lPush(REDIS_QUEUE, JSON.stringify(data));
  }

  pushDataInOrderQueue = (data: RedisDbQueueData, REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
    this.publisher.lPush(REDIS_QUEUE, JSON.stringify(data));
  }

  pushDataInWsQueue = (data: RedisWsQueueData, REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
    this.publisher.lPush(REDIS_QUEUE, JSON.stringify(data));
  }

  publishData = async (key: string, data: EngineResponse) => {
    this.publisher.publish(key, JSON.stringify(data));
  }

  publishData2 = async (key: string, data: unknown) => {
    this.publisher.publish(key, JSON.stringify(data));
  }

  getDataFromQueue = async (REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
    console.log("queue in get ", REDIS_QUEUE);
    return await this.client.brPop(REDIS_QUEUE, 0);
  };

  subscribe = async (key: string) => {
    this.subscriber.subscribe(key, (message) => {
      console.log("message in subscribe", message);
      
      const parsedResponse = JSON.parse(message);

      if (parsedResponse.type === "order_book") {
        wsUserManager.broadcast(parsedResponse.data);
      }
    })
  }

  static getInstance = (): RedisManager => {
    if (!RedisManager.instance) RedisManager.instance = new RedisManager();
    return RedisManager.instance;
  };
}

export const redisManager = RedisManager.getInstance();
