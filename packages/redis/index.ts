import { createClient, type RedisClientType } from "redis";
import { type EngineResponse, type REDIS_QUEUE_TYPE, type RedisQueueData } from "@repo/common/common";

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

  publishData = async (key: string, data: EngineResponse) => {
    this.publisher.publish(key, JSON.stringify(data));
  }

  getDataFromQueue = async (REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
    console.log("queue in get ", REDIS_QUEUE);
    return await this.subscriber.brPop(REDIS_QUEUE, 0);
  };

  static getInstance = (): RedisManager => {
    if (!RedisManager.instance) RedisManager.instance = new RedisManager();
    return RedisManager.instance;
  };
}

export const redisManager = RedisManager.getInstance();
