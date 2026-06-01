import { createClient, type RedisClientType } from "redis";
import { 
  GROUPS,
  type EngineResponse, 
  type MessageType, 
  type REDIS_QUEUE_TYPE, 
  type RedisDbQueueData, 
  type RedisQueueData, 
  type RedisWsQueueData
 } from "@repo/common/common";
import { wsUserManager } from "@repo/ws/ws";

class RedisManager {
  private static instance: RedisManager;
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private client: RedisClientType;

  constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
    this.client = createClient();
  }

  static getInstance = async (): Promise<RedisManager> => {
    if (!RedisManager.instance) {
      const instance = new RedisManager();
      await instance.init()
      RedisManager.instance = instance;
    }
    return RedisManager.instance;
  };
  

  private init = async () => {
    await this.initClients();
    await this.createGroups();
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

  private createGroups = async () => {
    for (const { consumer_grp, group_name, stream } of GROUPS) {
      try {
        await this.client.xGroupCreate(stream, group_name, '0', {
          MKSTREAM: true
        });
        console.log("group: ", group_name, "created");
      } catch {
        console.log("group: ", group_name, "already exists");
      }
    }
  }
  
  // waitForData = async (data: RedisQueueData, REDIS_QUEUE: REDIS_QUEUE_TYPE) => {
  //   console.log("queue in wait ", REDIS_QUEUE);
    
  //   return new Promise<EngineResponse>((res) => {
  //     this.subscriber.subscribe(data.clientId, (message) => {
  //       this.subscriber.unsubscribe(data.clientId);
  //       res(JSON.parse(message));
  //     });
  //     this.publisher.lPush(REDIS_QUEUE, JSON.stringify(data));
  //   });
  // };

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

  addToStream = async (group_stream: string, 
    data: 
      { type: "from-http-backend", data: RedisQueueData } 
      | 
      { type : "from-order-engine", data: EngineResponse }
  ) => {
    await this.client.xAdd(
      group_stream, 
      "*", 
      { data: JSON.stringify(data.data) }
    )
  }

  getFromStream = async (group_name: string, group_consumer: string, group_stream: string) => {
    const res = await this.client.xReadGroup(
      group_name,
      group_consumer,
      {
        id: ">",
        key: group_stream,
      },
      {
        BLOCK: 0,
      }
    );

    if (!res) return;
    if (!Array.isArray(res)) return;

    return res[0] as MessageType;
  }

  acknowledgeMent = async (group_stream: string, group_name: string, particular_message_id: string) => {
    const res = await this.client.xAck(group_stream, group_name, particular_message_id);
    console.log("acknowledgeMent ", res);
  }
  
  waitForData = async (
    group_name: string, 
    group_consumer: string, 
    group_stream: string, 
    response_steam: string,
    data: 
      { type: "from-http-backend", data: RedisQueueData } 
      | 
      { type : "from-order-engine", data: EngineResponse }
  ) => {

    return new Promise<MessageType>(async (res, rej) => {            
      
      await this.addToStream(response_steam, data);

      const response = await this.getFromStream(group_name, group_consumer, group_stream);

      if (response) res(response)
    });
  }

}

export const redisManager = await RedisManager.getInstance();
