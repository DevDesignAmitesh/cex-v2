import type { Balance, Fill, Order, OrderBook, OrderBookKey, orderSide } from "@repo/common/common";

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
  }

  static getInstance = (): EngineStore => {
    if (!EngineStore.instance) EngineStore.instance = new EngineStore();
    return EngineStore.instance;
  };

  deleteOrder = (userId: string, orderId: string) => {
    const index = this.ORDERS.findIndex((ord) => ord.userId === userId && ord.id === orderId);
    if (index === -1) return false;
    this.ORDERS.splice(index, 1);
    return true;
  }

  getSymbolDepth = (symbol: string) => {
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

  Object.entries(this.ORDERBOOK[stock].asks).map((data) => {
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

  Object.entries(this.ORDERBOOK[stock].bids).map((data) => {
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
    
    return finalOrderBookWithUserBasedDepth[stock]
  }

  getFills = (userId: string) => {
    return this.FILLS.find((fls) => fls.userId === userId);
  }

  getOrder = (orderId: string, userId: string) => {
    return this.ORDERS.find((ord) => ord.userId === userId && ord.id === orderId);
  }

  getOrders = (userId: string, open?: boolean) => {
    const arr = [];

    if (open && open === true) {
      for (let ord of this.ORDERS) {
        if (ord.userId !== userId) continue;
        if (ord.status !== "OPEN") continue;
        
        arr.push(ord); 
      }
    } else {
      for (let ord of this.ORDERS) {
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

    console.log("orderbook", this.ORDERBOOK);
    console.log("balances", this.BALANCES);
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

    console.log("orderbook", this.ORDERBOOK)
    console.log("balances", this.BALANCES)
    
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

        console.log("keys in asks ", key);

        console.log("all keys in asks ", keyPrice
          .sort((a, b) => Number(a) - Number(b)))
        
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

          console.log("all keys in bids ", keyPrice
          .sort((a, b) => Number(b) - Number(a)))
          
          console.log("keys in bids ", key);
          
          return { orderBookKey: key.keyWithUser, keyPrice: key.keyWithoutUser, qty: data[key.keyWithUser]!.totalQuantity };
        }
    }

    if (keyPrice.find((key) => price === key.keyWithoutUser)) {
      key = keyPrice.find((key) => price === key.keyWithoutUser)!;

      console.log("keys in else ", key);
      
      return { orderBookKey: key.keyWithUser, keyPrice: key.keyWithoutUser, qty: data[key.keyWithUser]!.totalQuantity };
    }

    return null;
  }

  completeLimitOrder = (side: orderSide, orderBookKey: string, userQty: number, userId: string, finalPrice: number,) => {
    const order =
      this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey];

    const orderId = crypto.randomUUID();
      
    const keyPrice = orderBookKey.split("-")[0]!

    this.ORDERS.push({
      id: orderId,
      createdAt: new Date(),
      filledQty: userQty,
      qty: userQty,
      userId,
      price: finalPrice,
      market: "AXIS",
      side,
      status: "FILLED",
      type: "LIMIT",
    });

    const fillId = crypto.randomUUID();

    this.FILLS.push({
      id: fillId,
      orderId,
      userId,
      price: finalPrice,
      qty: userQty,
      side,
      asset: "AXIS",
      type: "TAKER",
      createdAt: new Date(),
    });

    this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey] = {
      totalQuantity: order?.totalQuantity! - userQty,
    };

    if (
      this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]
        ?.totalQuantity === 0
    ) {
      delete this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey];
    }
    
    this.ORDERBOOK["AXIS"].lastTradedPrice = Number(keyPrice);

    const fills = this.getFills(userId);
    
    return {
      orderId,
      fills,
    };
  }
}

export const engineStore = EngineStore.getInstance();
