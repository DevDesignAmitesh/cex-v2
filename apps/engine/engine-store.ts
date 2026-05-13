import type { Balance, Fill, Order, OrderBook, OrderBookKey } from "@repo/common/common";

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
    if (index === -1) return false
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
    return this.BALANCES[userId]
  }
}

export const engineStore = EngineStore.getInstance();
