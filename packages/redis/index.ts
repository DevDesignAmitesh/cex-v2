import { createClient, type RedisClientType } from "redis";
import {
  GROUPS,
  type EngineResponse,
  type MessageType,
  type REDIS_QUEUE_TYPE,
  type RedisDbQueueData,
  type RedisQueueData,
  type RedisWsQueueData,
} from "@repo/common/common";
import { wsUserManager } from "@repo/ws/ws";

const REDIS_URL = process.env.REDIS_URL ?? undefined;

class RedisManager {
  private static instance: RedisManager;
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private client: RedisClientType;

  constructor() {
    this.publisher = createClient({
      url: REDIS_URL
    });
    this.subscriber = createClient({
      url: REDIS_URL
    });
    this.client = createClient({
      url: REDIS_URL
    });
  }

  static getInstance = async (): Promise<RedisManager> => {
    if (!RedisManager.instance) {
      const instance = new RedisManager();
      await instance.init();
      RedisManager.instance = instance;
    }
    return RedisManager.instance;
  };

  private init = async () => {
    await this.initClients();
    this.publisher.on("error", () => console.error);
    this.client.on("error", () => console.error);
    this.subscriber.on("error", () => console.error);
    await this.client.ping()
    await this.createGroups();
  };

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

  private createGroups = async () => {
    for (const { consumer_grp, group_name, stream } of GROUPS) {
      try {
        await this.client.xGroupCreate(stream, group_name, "0", {
          MKSTREAM: true,
        });
        console.log("group: ", group_name, "created");
      } catch {
        console.log("group: ", group_name, "already exists");
      }
    }
  };

  pushDataInQueue = (data: RedisQueueData, REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
    this.publisher.lPush(REDIS_QUEUE, JSON.stringify(data));
  };

  pushDataInOrderQueue = (
    data: RedisDbQueueData,
    REDIS_QUEUE: REDIS_QUEUE_TYPE,
  ) => {
    this.publisher.lPush(REDIS_QUEUE, JSON.stringify(data));
  };

  pushDataInWsQueue = (
    data: RedisWsQueueData,
    REDIS_QUEUE: REDIS_QUEUE_TYPE,
  ) => {
    this.publisher.lPush(REDIS_QUEUE, JSON.stringify(data));
  };

  publishData = async (key: string, data: EngineResponse) => {
    this.publisher.publish(key, JSON.stringify(data));
  };

  publishData2 = async (key: string, data: unknown) => {
    this.publisher.publish(key, JSON.stringify(data));
  };

  getDataFromQueue = async (REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
    return await this.client.brPop(REDIS_QUEUE, 0);
  };

  subscribe = async (key: string) => {
    this.subscriber.subscribe(key, (message) => {
      
      const parsedResponse = JSON.parse(message);

      if (parsedResponse.type === "order_book") {
        // TODO: check is .data defined??
        wsUserManager.broadcastOrderBook(parsedResponse.data.orderBook);
      }
    });
  };

  addToStream = async (
    group_stream: string,
    data:
      | { type: "http-to-engine"; data: RedisQueueData }
      | { type: "engine-to-http"; data: EngineResponse }
      | { type: "engine-to-common"; data: RedisDbQueueData },
  ) => {
    return await this.client.xAdd(group_stream, "*", {
      data: JSON.stringify(data.data),
    });
  };

  getFromStream = async (
    group_name: string,
    group_consumer: string,
    group_stream: string,
  ) => {
    const res = await this.client.xReadGroup(
      group_name,
      group_consumer,
      [{
        id: ">",
        key: group_stream,
      }],
      {
        COUNT: 1,
        BLOCK: 0,
      },
    );

    if (!res) return;
    if (!Array.isArray(res)) return;

    return res[0] as MessageType;
  };

  getFromSingleStream = async (
    group_stream: string,
  ) => {
    const res = await this.client.xRead(
      {
        id: "$",
        key: group_stream,
      },
      {
        COUNT: 1,
        BLOCK: 0,
      },
    );

    if (!res) return;
    if (!Array.isArray(res)) return;

    return res[0] as MessageType;
  };

  acknowledgeMent = async (
    group_stream: string,
    group_name: string,
    particular_message_id: string,
  ) => {
    const res = await this.client.xAck(
      group_stream,
      group_name,
      particular_message_id,
    );
    console.log("acknowledgeMent", res);
  };

  waitForData = async (
    group_name: string,
    group_consumer: string,
    group_stream: string,
    response_steam: string,
    data:
      | { type: "http-to-engine"; data: RedisQueueData }
      | { type: "engine-to-http"; data: EngineResponse }
      | { type: "engine-to-common"; data: RedisDbQueueData },
  ) => {
    return new Promise<MessageType>(async (res, rej) => {
      const putting_stream_message_id = await this.addToStream(response_steam, data);

      const response = await this.getFromStream(
        group_name,
        group_consumer,
        group_stream,
      );

      if (response) res({ ...response, putting_stream_message_id });
    });
  };
}

export const redisManager = await RedisManager.getInstance();
