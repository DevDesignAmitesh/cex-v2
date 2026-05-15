import type { Balance, EngineResponse, Fill, Order, OrderBook, OrderBookKey, orderSide, orderType, RedisQueueData } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";

class EngineStore {
  private static instance: EngineStore;
  private FILLS: Fill[];
  private ORDERS: Order[];
  private BALANCES: Balance;
  private ORDERBOOK: OrderBook;

  constructor() {
    this.FILLS = [];
    this.ORDERS = [];
    // this.BALANCES = {
    //   "1": {
    //     AXIS: { locked, total },
    //     HDFC: { locked, total },
    //     INR: { locked, total },
    //     TATA: { locked, total },
    //   },
    // };
    this.BALANCES = {};
    this.ORDERBOOK = {
      AXIS: { bids: {}, asks: {}, lastTradedPrice: 0 },
      HDFC: { bids: {}, asks: {}, lastTradedPrice: 0 },
      TATA: { bids: {}, asks: {}, lastTradedPrice: 0 },
    };

    setInterval(() => this.getSymbolDepth("INR-AXIS", true), 5 * 1000)
  }

  static getInstance = (): EngineStore => {
    if (!EngineStore.instance) EngineStore.instance = new EngineStore();
    return EngineStore.instance;
  };

  deleteOrder = (userId: string, orderId: string) => {
    const order = this.ORDERS.find((ord) => ord.userId === userId && ord.id === orderId);
    if (!order) return false;

    let newOrder = order;

    if (order) {
      newOrder = {
        ...order,
        status: "CANCELLED"
      }
    }

    const fillteredOrder = this.ORDERS.filter((ord) => ord.userId === userId && ord.id === orderId);
    fillteredOrder.push(newOrder)

    this.ORDERS = fillteredOrder;
    return true;
  }

  getSymbolDepth = (symbol: string, isQueue?: boolean) => {
    // symbol === CURRENCY/STOCK (INR/AXIS);
    const stock = symbol.split("-")[1] as OrderBookKey | undefined;
    if(!stock) return null

    let finalOrderBookWithUserBasedDepth: Record<
      OrderBookKey,
      {
        bids: Record<
          string,
          {
            totalQuantity: number;
            userId: string
          }
        >;
        asks: Record<
          string,
          {
            totalQuantity: number;
            userId: string
          }
        >;
        lastTradedPrice: number;
      }
    > = {
      AXIS: { bids: {}, asks: {}, lastTradedPrice: 0 },
      HDFC: { bids: {}, asks: {}, lastTradedPrice: 0 },
      TATA: { bids: {}, asks: {}, lastTradedPrice: 0 },
    }
    
    Object.entries(this.ORDERBOOK[stock]).map((data) => {
      const key = data[0];
      const value = data[1];

      if (key !== "lastTradedPrice") return;
      
      finalOrderBookWithUserBasedDepth.AXIS = {
        ...finalOrderBookWithUserBasedDepth.AXIS,
        lastTradedPrice: (value as number)
      }
    })

    Object.entries(this.ORDERBOOK[stock].asks)
      .sort((a, b) => Number(b) - Number(a))
      .map((data) => {
        const orderBookKey = data[0]
        const price = orderBookKey.split("-")[0]!;
        const userId = orderBookKey.split(`${price}-`)[1]!;      

        const value = this.ORDERBOOK[stock].asks[orderBookKey]!

        finalOrderBookWithUserBasedDepth.AXIS.asks[price] = {
          ...finalOrderBookWithUserBasedDepth.AXIS.asks[price],
          totalQuantity: value.totalQuantity,
          userId
        }
    });

    Object.entries(this.ORDERBOOK[stock].bids)
      .sort((a, b) => Number(a) - Number(b))
      .map((data) => {
        const orderBookKey = data[0]
        const price = orderBookKey.split("-")[0]!;
        const userId = orderBookKey.split(`${price}-`)[1]!;      
        
        const value = this.ORDERBOOK[stock].bids[orderBookKey]!

        finalOrderBookWithUserBasedDepth.AXIS.bids[price] = {
          ...finalOrderBookWithUserBasedDepth.AXIS.bids[price],
          totalQuantity: value.totalQuantity,
          userId
        }
    });
      
    if (isQueue) {  
      setInterval(() => {
          redisManager.pushDataInWsQueue({
          type: "order_book",
          data: finalOrderBookWithUserBasedDepth
        }, "orderbook-to-ws-queue")
      }, 2 * 1000)
    }
    
    return finalOrderBookWithUserBasedDepth[stock]
  }

  getFills = (userId: string) => {
    const arr: Fill[] = []    

    this.FILLS.forEach((fls) => {
      console.log(fls.userId === userId);
      if (fls.userId === userId) {
        arr.push(fls)
      }
    });
    
    console.log("arr", arr)
    
    return arr;
  }

  getOrder = (orderId: string, userId: string) => {
    return this.ORDERS.find((ord) => ord.userId === userId && ord.id === orderId && ord.status !== "CANCELLED");
  }

  getOrders = (userId: string, open?: boolean) => {
    const arr = [];

    if (open && open === true) {
      for (let ord of this.ORDERS) {
        if (ord.status === "CANCELLED") continue;
        if (ord.userId !== userId) continue;
        if (ord.status !== "OPEN") continue;
        
        arr.push(ord); 
      }
    } else {
      for (let ord of this.ORDERS) {
        if (ord.status === "CANCELLED") continue;
        if (ord.userId !== userId) continue;
        arr.push(ord);
      }
    }

    return arr;
  }


  getUserBalance = (userId: string) => {
    if (!this.BALANCES[userId]){
      this.BALANCES[userId] = {
          AXIS: { locked: 0, total: 1000 },
          HDFC: { locked: 0, total: 1000 },
          INR: { locked: 0, total: 10000 },
          TATA: { locked: 0, total: 1000 },
      };
    }

    return this.BALANCES[userId];
  }

  gettingAndLockingUserBalance = (userId: string, price: number, qty: number, side: orderSide) => {
    const userBalance = this.getUserBalance(userId);
    if (!userBalance) return false;
    
    if (side === "BUY") {
      const requiredBalance = price * qty;
      /**
       * requiredBalance = 1000;
       * userBalance = userBalance.INR.total (1200) - userBalance.INR.locked (100)
       * userBalance = 1100
       * means allowed else not
      */
      
      if (requiredBalance > userBalance.INR.total - userBalance.INR.locked) return false;
      userBalance.INR.locked += requiredBalance;
      return true;
    } else if (side === "SELL") {
      const requiredQty = qty;

      /**
       *requiredQty = 1000;
       * userBalance = userBalance.AXIS.total (1200) - userBalance.AXIS.locked (100)
       * userBalance = 1100
       * means allowed else not
      */
      
      if (requiredQty > userBalance.AXIS.total - userBalance.AXIS.locked) return false;
      userBalance.AXIS.locked += requiredQty;
      return true;
    }

    return false;
  }

  resetLockBalalnceOfUser = (userId: string, side: orderSide) => {
    const userBalance = this.getUserBalance(userId);
    if (!userBalance) return false;

    if (side === "BUY") {
      userBalance.INR.locked = 0;
    } else {
      userBalance.AXIS.locked = 0;
    }
  }

  deductTotalBalalnceOfUser = (userId: string, side: orderSide, finalPrice: number, qty: number) => {
    const userBalance = this.getUserBalance(userId);
    if (!userBalance) return false;

    if (side === "BUY") {
      userBalance.INR.total -= finalPrice * qty;
    } else if (side === "SELL") {
      userBalance.AXIS.total -= qty;
    }

  }


  addNewAsksOrBidsInOrderBook = (
    type: "asks" | "bids",
    price: number,
    userId: string,
    orderBookKey: OrderBookKey,
    leftQty: number,
  ) => { 
    /**
     * 1. adding user's order in orderBook
     * &&
     * 2. deducting the quantiy of that price
     */
    const key = `${price}-${userId}`
    
    const orderQty = this.ORDERBOOK[orderBookKey][type][key]?.totalQuantity || 0;

    this.ORDERBOOK[orderBookKey][type][key] = {
      totalQuantity: orderQty + leftQty,
    };    

    
  }

  checkAvailablePriceInOrderBook =(
    price: number,
    balanceKey: OrderBookKey,
    type: "asks" | "bids",
  ) => {
    const data = this.ORDERBOOK[balanceKey][type];
    let key: {
      keyWithUser: string,
      keyWithoutUser: number
    } = {
      keyWithoutUser: 0,
      keyWithUser: ""
    }

    const keys = Object.keys(data);
    const keyPrice = keys.map((key) => ({
      keyWithUser: key!,
      // `${price}-${userId}`
      keyWithoutUser: Number(key.split("-")[0])!
    }));
    
    if (type === "asks") {
      if (keyPrice
          .sort((a, b) => Number(a) - Number(b)).
          find((data) => Number(data.keyWithoutUser)! < price)) {

        key = keyPrice
          .sort((a, b) => Number(a) - Number(b)).
          find((data) => data.keyWithoutUser! < price)!

        
        return { orderBookKey: key.keyWithUser, keyPrice: key.keyWithoutUser, qty: data[key.keyWithUser]!.totalQuantity };
      }
    }

    if (type === "bids") {
      if (
        keyPrice
          .sort((a, b) => Number(b) - Number(a)).
          find((data) => data.keyWithoutUser! > price)
      ) {
        key = keyPrice
          .sort((a, b) => Number(b) - Number(a)).
          find((data) => data.keyWithoutUser! > price)!

          
          return { orderBookKey: key.keyWithUser, keyPrice: key.keyWithoutUser, qty: data[key.keyWithUser]!.totalQuantity };
        }
    }

    if (keyPrice.find((key) => price === key.keyWithoutUser)) {
      key = keyPrice.find((key) => price === key.keyWithoutUser)!;

      
      return { orderBookKey: key.keyWithUser, keyPrice: key.keyWithoutUser, qty: data[key.keyWithUser]!.totalQuantity };
    }

    return null;
  }

  completeOrder = (side: orderSide, orderBookKey: string, userQty: number, availableQty: number, userId: string, finalPrice: number, type: orderType) => {
    const order =
      this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey];

    console.log("order", this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey])
    console.log("userqty", userQty)
      
    const orderId = crypto.randomUUID();
      
    const keyPrice = orderBookKey.split("-")[0]!

    this.ORDERS.push({
      id: orderId,
      createdAt: new Date(),
      filledQty: availableQty,
      qty: userQty,
      userId,
      price: finalPrice,
      market: "AXIS",
      side,
      status: "FILLED",
      type,
    });

    const fillId = crypto.randomUUID();

    this.FILLS.push({
      id: fillId,
      orderId,
      userId,
      price: finalPrice,
      qty: availableQty,
      side,
      asset: "AXIS",
      type: "TAKER",
      createdAt: new Date(),
    });

    this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey] = {
      totalQuantity: order?.totalQuantity! - availableQty,
    };

    console.log("condition", this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]
        ?.totalQuantity === 0)
    
    if (
      this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]
        ?.totalQuantity === 0
    ) {
      delete this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey];
    }
    
    this.ORDERBOOK["AXIS"].lastTradedPrice = Number(keyPrice);

    const fills = this.getFills(userId);
    
    redisManager.pushDataInOrderQueue({
      type: "create_order",
      data: {
        filledQty: availableQty,
        fillType: "TAKER",
        price: finalPrice,
        qty: userQty,
        side,
        status: "FILLED",
        type,
        userId
      }
    }, "orderbook-to-db-queue")
    
    return {
      orderId,
      fills,
    };
  }

  beforeOrder = (parsedResponse: RedisQueueData): EngineResponse => {
    if (parsedResponse.type !== "create_order") return {
      clientId: parsedResponse.clientId,
      ok: false
    }
      
    const { side, symbol, type, userId, price, qty } = parsedResponse.data;

    if (type === "LIMIT") {
      if (price === undefined || qty === undefined) {
        return {
          clientId: parsedResponse.clientId,
          ok: false,
          error: "Price and quantity both should be defined.",
        };
      }
    } else if (type === "MARKET") {
      if (price === undefined && qty === undefined) {
        return {
          clientId: parsedResponse.clientId,
          ok: false,
          error: "Price and quantity both should be defined.",
        };
      }
    }
    
    if (price === undefined || qty === undefined) {
      return {
        clientId: parsedResponse.clientId,
        ok: false,
        error: "Price and quantity both should be defined.",
      };
    }


    const isUserHaveBalance = this.gettingAndLockingUserBalance(
      userId,
      price,
      qty,
      side,
    );


    if (!isUserHaveBalance) {
      return {
        clientId: parsedResponse.clientId,
        ok: false,
        error: "Insufficient balance.",
      };
    }

    const availablePrice = engineStore.checkAvailablePriceInOrderBook(
      price,
      "AXIS",
      side === "BUY" ? "asks" : "bids",
    );


    if (!availablePrice && type === "MARKET") {
      return {
      clientId: parsedResponse.clientId,
      ok: false,
      data: {
        message: "available price not found",
        data: undefined
      }
    }
    }
    
    if (!availablePrice) {
      // push in the order book
      this.addNewAsksOrBidsInOrderBook(
        side === "SELL" ? "asks" : "bids",
        price,
        userId,
        "AXIS",
        qty,
      );

      return {
        clientId: parsedResponse.clientId,
        ok: true,
        data: {
          message: "Order added in the order book",
          data: undefined,
        },
      };
    }

    // quantiy thing
    return {
      clientId: parsedResponse.clientId,
      ok: true,
      data: {
        message: "available price found",
        data: availablePrice
      }
    }
  }

  getLastTradingPrice() {
    return this.ORDERBOOK["AXIS"].lastTradedPrice
  }
  
}

export const engineStore = EngineStore.getInstance();
