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
    const stock = symbol.split("/")[1] as OrderBookKey | undefined;
    if(!stock) return null

    return this.ORDERBOOK[stock]
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
      userBalance.INR.total -= finalPrice;
    } else if (side === "SELL") {
      userBalance.AXIS.total -= qty;
    }
  }


  addNewAsksOrBidsInOrderBook = (
    type: "asks" | "bids",
    price: number,
    orderBookKey: OrderBookKey,
    leftQty: number,
  ) => { 
    /**
     * 1. adding user's order in orderBook
     * &&
     * 2. deducting the quantiy of that price
     */
    const orderQty = this.ORDERBOOK[orderBookKey][type][price]?.totalQuantity || 0;

    this.ORDERBOOK[orderBookKey][type][price] = {
      totalQuantity: orderQty + leftQty,
    };
  }

  checkAvailablePriceInOrderBook =(
    price: number,
    balanceKey: OrderBookKey,
    type: "asks" | "bids",
  ) => {
    const data = this.ORDERBOOK[balanceKey][type];
    const stringifiedPrice = String(price);
    let key: number = 0;

    const keys = Object.keys(data);
    
    if (type === "asks") {
      // we can keys[0]
      if (keys[0]! < stringifiedPrice) {
        // key = Number(keys.find((key) => key < stringifiedPrice));
        key = Number(keys[0])

        return { keyPrice: key, qty: data[key]!.totalQuantity };
      }
    }

    if (type === "bids") {
      if (
        keys
        // we can add this after sort [0]
          .sort((a, b) => Number(b) - Number(a))[0]
          // .find((key) => key > stringifiedPrice)
      ) {
        key = Number(
          keys
            .sort((a, b) => Number(b) - Number(a))[0]
            // .find((key) => key > stringifiedPrice),
          );
          
          return { keyPrice: key, qty: data[key]!.totalQuantity };
        }
      }

    if (keys.find((key) => stringifiedPrice === key)) {
      key = Number(keys.find((key) => stringifiedPrice === key));

      return { keyPrice: key, qty: data[key]!.totalQuantity };
    }

    return null;
  }

  completeLimitOrder = (side: orderSide, keyPrice: number, userQty: number, userId: string, finalPrice: number, userPrice: number) => {
    const order =
      this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][keyPrice];

    const orderId = crypto.randomUUID();
      

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

    this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][keyPrice] = {
      totalQuantity: order?.totalQuantity! - userQty,
    };

    if (
      this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][keyPrice]
        ?.totalQuantity === 0
    ) {
      delete this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][keyPrice];
    }

    this.ORDERBOOK["AXIS"].lastTradedPrice = keyPrice;

    const fills = this.getFills(userId);
    
    return {
      orderId,
      fills,
    };
  }
}

export const engineStore = EngineStore.getInstance();
