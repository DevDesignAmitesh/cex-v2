import type { Balance, EngineResponse, Fill, Order, OrderBook, OrderBookKey, OrderBookOrder, orderSide, orderType, RedisQueueData, UserBasedOrderBook } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";

class EngineStore {
  private static instance: EngineStore;
  private FILLS: Fill[];
  private ORDERS: Order[];
  private BALANCES: Balance;
  // private ORDERBOOK: OrderBook;
  private USERORDERBOOK: UserBasedOrderBook

  constructor() {
    this.FILLS = [];
    this.ORDERS = [];
    // this.BALANCES["1"] = {
    //   AXIS: { locked, total },
    //   HDFC: { locked, total },
    //   INR: { locked, total },
    //   TATA: { locked, total },
    // };

    this.BALANCES = {};
    // this.ORDERBOOK = {
    //   AXIS: { bids: {}, asks: {}, lastTradedPrice: 0 },
    //   HDFC: { bids: {}, asks: {}, lastTradedPrice: 0 },
    //   TATA: { bids: {}, asks: {}, lastTradedPrice: 0 },
    // };

    this.USERORDERBOOK = {
      AXIS: { bids: {}, asks: {}, lastTradedPrice: 0 },
      HDFC: { bids: {}, asks: {}, lastTradedPrice: 0 },
      TATA: { bids: {}, asks: {}, lastTradedPrice: 0 },
    };

    // this.USERORDERBOOK = {
    //   AXIS: { bids: {
    //     500: [
    //       {
    //         totalQuantity: 20,
    //         userId: "1",
    //         price: 500
    //       }
    //     ],
    //     200: [
    //       {
    //         totalQuantity: 20,
    //         userId: "1",
    //         price: 200
    //       }
    //     ],
    //     600: [
    //       {
    //         totalQuantity: 20,
    //         userId: "1",
    //         price: 600
    //       }
    //     ],
    //   }, asks: {
    //     200: [
    //       {
    //         totalQuantity: 20,
    //         userId: "1",
    //         price: 200
    //       }
    //     ],
    //     500: [
    //       {
    //         totalQuantity: 20,
    //         userId: "1",
    //         price: 200
    //       }
    //     ],
    //     300: [
    //       {
    //         totalQuantity: 20,
    //         userId: "1",
    //         price: 200
    //       }
    //     ],
    //   }, lastTradedPrice: 0 },
    //   HDFC: { bids: {}, asks: {}, lastTradedPrice: 0 },
    //   TATA: { bids: {}, asks: {}, lastTradedPrice: 0 },
    // };

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
      
    if (isQueue) {  
        redisManager.pushDataInWsQueue({
        type: "order_book",
        // data: this.ORDERBOOK
        data: this.USERORDERBOOK
      }, "orderbook-to-ws-queue")
    }
    
    // return this.ORDERBOOK[stock]
    return this.USERORDERBOOK[stock]
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
    if (!this.BALANCES[userId]) {
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
    qtyToAdd: number,
  ) => { 
    // for orignal order book
    const key = price;
    
    // const orderQty = this.ORDERBOOK[orderBookKey][type][key]?.totalQuantity || 0;

    // this.ORDERBOOK[orderBookKey][type][key] = {
    //   totalQuantity: orderQty.totalQuantity + qtyToAdd,
    // };

    this.USERORDERBOOK[orderBookKey][type][key]!.push({
      totalQuantity: qtyToAdd,
      price: key,
      userId
    }) 
  }

  checkAvailablePriceInOrderBook =(
    price: number,
    balanceKey: OrderBookKey,
    type: "asks" | "bids",
  ) => {
    // const data = this.ORDERBOOK[balanceKey][type];
    const data2 = this.USERORDERBOOK[balanceKey][type];
    // let key: number = 0

    // const keys = Object.keys(data);

    let keys;
    
    if (type === "asks") {
      keys = Object.entries(data2);
    } else {
      keys = Object.entries(data2).sort((a, b) => Number(b[0]) - Number(a[0]));
    }

    for (const [idx, [key, value]] of Object.entries(keys)) {
      console.log(idx)
      console.log(key)
      console.log(value)

      const keyPrice = Number(key);
      const keyValue = value.find((val) => val.price === keyPrice)!;

      if (type === "asks") {
        if (keyPrice <= price) {
          return { orderBookKey: keyPrice, keyPrice, qty: keyValue.totalQuantity };
        }
      }
      
      if (type === "bids") {
        if (keyPrice >= price) {
          return { orderBookKey: keyPrice, keyPrice, qty: keyValue.totalQuantity };
        }
      }
      
    }

    
    // if (type === "asks") {
    //   if (keys
    //         .find((data) => Number(data)! < price)) {

    //     key = Number(keys.find((data) => Number(data)! < price))!

    //     return { orderBookKey: key, keyPrice: key, qty: data[key]!.totalQuantity };
    //   }
    // }

    // if (type === "bids") {
    //   if (
    //     keys
    //       .sort((a, b) => Number(b) - Number(a) ? 1 : -1).
    //       find((data) => Number(data)! > price)
    //   ) {
    //     key = Number(keys
    //       .sort((a, b) => Number(b) - Number(a)).
    //       find((data) => Number(data)! > price))!

          
    //       return { orderBookKey: key, keyPrice: key, qty: data[key]!.totalQuantity };
    //     }
    // }

    // if (keys.find((key) => price === Number(key))) {
    //   key = Number(keys.find((key) => price === Number(key)))!;

      
    //   return { orderBookKey: key, keyPrice: key, qty: data[key]!.totalQuantity };
    // }

    return null;
  }

  completeOrder = (side: orderSide, orderBookKey: number, userQty: number, availableQty: number, userId: string, finalPrice: number, type: orderType) => {
    // const order =
    //   this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey];
    const order2 =
      this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]?.find((ord) => ord.price === orderBookKey)!;
      
    const orderId = crypto.randomUUID();
      
    this.ORDERS.push({
      id: orderId,
      createdAt: new Date(),
      filledQty: availableQty,
      qty: userQty,
      userId,
      price: finalPrice,
      market: "AXIS",
      side,
      status: "OPEN",
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

    // this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey] = {
    //   totalQuantity: order2?.totalQuantity! - availableQty,
    // };
    
    const updatedOrder: OrderBookOrder = {
      ...order2,
      totalQuantity: order2?.totalQuantity! - availableQty
    }

    const updatedAXISOrder = this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]
      ?.filter((ord) => ord.price === orderBookKey)!
      
    updatedAXISOrder?.push(updatedOrder)

    this.USERORDERBOOK.AXIS[side === "BUY" ? "asks" : "bids"][orderBookKey] = {
      ...this.USERORDERBOOK.AXIS[side === "BUY" ? "asks" : "bids"][orderBookKey] = updatedAXISOrder
    }
    
    // if (
    //   this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]
    //     ?.totalQuantity === 0
    // ) {
    //   delete this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey];
    // }

    const reFetchedOrder = 
      this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]?.find((ord, idx) => ord.price === orderBookKey)!
    
    const reFetchedOrderIdx = 
      this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]?.findIndex((ord, idx) => ord.price === orderBookKey)!
      
    if (reFetchedOrder.totalQuantity === 0) {
      this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]
        ?.splice(reFetchedOrderIdx, 0)
    }
    
    
    // this.ORDERBOOK["AXIS"].lastTradedPrice = orderBookKey;

    this.USERORDERBOOK["AXIS"].lastTradedPrice = orderBookKey;

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
    // return this.ORDERBOOK["AXIS"].lastTradedPrice
    return this.USERORDERBOOK["AXIS"].lastTradedPrice
  }

  testFn = () => {
    let reFetchedOrderIdx = 0
    
    const reFetchedOrder = 
      this.USERORDERBOOK["AXIS"]["bids"][600]?.find((ord, idx) => {
        reFetchedOrderIdx = idx; 
        return ord.price === 600
      })!
      
      return { reFetchedOrder, reFetchedOrderIdx }
  }
  
}

export const engineStore = EngineStore.getInstance();
