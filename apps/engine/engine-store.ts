import type { Balance, BalanceKey, EngineResponse, Fill, Order, OrderBook, OrderBookKey, OrderBookOrder, orderSide, orderType, RedisQueueData, UserBasedOrderBook, UserInOrderBook } from "@repo/common/common";
import { redisManager } from "@repo/redis/redis";
import fs from "fs";

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

    this.BALANCES = this.readBackupData().BALANCES ?? {};
    // this.ORDERBOOK = {
    //   AXIS: { bids: {}, asks: {}, lastTradedPrice: 0 },
    //   HDFC: { bids: {}, asks: {}, lastTradedPrice: 0 },
    //   TATA: { bids: {}, asks: {}, lastTradedPrice: 0 },
    // };

    this.USERORDERBOOK = this.readBackupData().USERORDERBOOK ?? {
      AXIS: { bids: {}, asks: {}, lastTradedPrice: 0 },
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
    setInterval(() => this.backupData(), 5 * 1000)
    setInterval(() => {
      console.log("ORDERBOOK", this.USERORDERBOOK)
      console.log("BALANCES", this.BALANCES)
    }, 5 * 1000)
  }

  static getInstance = (): EngineStore => {
    if (!EngineStore.instance) EngineStore.instance = new EngineStore();
    return EngineStore.instance;
  };

  deleteOrder = (userId: string, orderId: string) => {
    const orderIndex = this.ORDERS.findIndex((ord) => ord.userId === userId && ord.id === orderId);
    if (orderIndex === -1) return false;

    this.ORDERS.splice(orderIndex, 0)

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

  // TODO: check this why its return only []
  getFills = (userId: string, orderId?: string) => {
    const arr: Fill[] = []    

    console.log("FILLS", this.FILLS);
    
    if (orderId) {
      this.FILLS.forEach((fls) => {
        if (fls.takerId === userId || fls.makerId == userId) {
          if (fls.makerOrderId === orderId || fls.takerOrderId === orderId) {
            arr.push(fls)
          }
        }
      });
    } else {
      this.FILLS.forEach((fls) => {
        if (fls.takerId === userId || fls.makerId == userId) {
          arr.push(fls)
        }
      });
    }
    
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
    // if not then assign default values to the user and return it
    
    if (!this.BALANCES[userId]) {
      this.BALANCES[userId] = {
        AXIS: { locked: 0, total: 1000 },
        INR: { locked: 0, total: 10000 },
        COLLATERAL: { locked: 0, total: 10000 },
      };
    }

    return this.BALANCES[userId];
  }

  gettingAndLockingUserBalance = (userId: string, price: number, qty: number, side: orderSide) => {
    // getting user's balance
    const userBalance = this.getUserBalance(userId);
    if (!userBalance) return false;
    
    if (side === "BUY") {
      // while buying qty of a stock we need to confirm does the user have this much amout to PAY
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
      // in the case of selling, does the user have this much qty to sell
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

  deductTotalBalalnceOfUser = (userId: string, side: orderSide, finalPrice: number, qty: number, presentUser: boolean) => {
    const userBalance = this.getUserBalance(userId);
    if (!userBalance) return false;

    if (presentUser) {
      if (side === "BUY") {
        userBalance.INR.total -= finalPrice * qty;
      } else if (side === "SELL") {
        userBalance.AXIS.total -= qty;
      }
    } else {
      if (side === "SELL") {
        userBalance.INR.total -= finalPrice * qty;
      } else if (side === "BUY") {
        userBalance.AXIS.total -= qty;
      }
    }

  }


  addNewAsksOrBidsInOrderBook = (
    type: "asks" | "bids",
    price: number,
    userId: string,
    orderBookKey: OrderBookKey,
    qtyToAdd: number,
  ) => { 
    // if not created assigning default values
    if (!this.USERORDERBOOK[orderBookKey][type][price]) {
      this.USERORDERBOOK[orderBookKey][type][price] = {
        createdAt: Date.now(),
        totalQuantity: 0,
        users: []
      }
    }
    
    // fetching the order 
    const order = this.USERORDERBOOK[orderBookKey][type][price]!;
    
    // apending all latest details to this one
    this.USERORDERBOOK[orderBookKey][type][price] = {
      createdAt: Date.now(),
      totalQuantity: order.totalQuantity + qtyToAdd,
      users: [ ...order.users, { id: userId, createdAt: Date.now(), qty: qtyToAdd, price } ]
    }

    // refetching the order with the latest details
    const reFetchedOrder = this.USERORDERBOOK[orderBookKey][type][price]!;

    // deleting this one
    delete this.USERORDERBOOK[orderBookKey][type][price]
    
    // sorting the users
    const sortedUsers = reFetchedOrder.users.sort((a, b) => a.createdAt - b.createdAt);
    
    // creating new one with the refetched order book with the sorted users
    this.USERORDERBOOK[orderBookKey][type][price] = {
      createdAt: reFetchedOrder.createdAt,
      totalQuantity: reFetchedOrder.totalQuantity,
      users: sortedUsers
    }
  }

  checkAvailablePriceInOrderBook =(
    price: number,
    balanceKey: OrderBookKey,
    type: "asks" | "bids",
  ) => {
    // const data = this.ORDERBOOK[balanceKey][type];
    const data = this.USERORDERBOOK[balanceKey][type];
    // let key: number = 0

    // const keys = Object.keys(data);

    let keys;
    
    if (type === "asks") {
      // by default sorting from small to big numbers
      keys = Object.entries(data)
    } else {
      // for bids we need the biggest number on the top, so thats why sorting it
      keys = Object.entries(data).sort((a, b) => Number(b[0]) - Number(a[0]));
    }

    // these are the users from which we are deducting stocks (quantity)
    for (const [idx, [key, value]] of Object.entries(keys)) {
      /**
       * here 200 is the keyPrice and keyvalue is that array
       * 200: [{
       *    totalQuantity: number,
       *    userId: string
       * }]
       */
      
      const keyPrice = Number(key);
      
      // in the array there are many qty of different users to adding thosee
      if (type === "asks") {
        // finding the best buying price for the buyers for that we need LESS or EQUAL price (compare to the user)
        if (keyPrice <= price) {
          return { orderBookKey: keyPrice, keyPrice, qty: value.totalQuantity };
        }
      }
      
      if (type === "bids") {
        // finding best selling price for the sellers for that we need MORE or EQUAL price (compare to the user)
        if (keyPrice >= price) {
          return { orderBookKey: keyPrice, keyPrice, qty: value.totalQuantity };
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


  deductQtyAndBalanceOfInvolvedUsers = (users: UserInOrderBook[], availableQty: number, side: orderSide, finalPrice: number) => {    
    let decreasingQty = availableQty; // let say this 10
    
    const updatedUsers: UserInOrderBook[] = []

    // deducting quantity of the users involved in the swap
    for (const val of users) {
      if (decreasingQty - val.qty >= 0 ) { // here it will be 10 - (4) imaginary = 6 (means this user's all qty gone)
        updatedUsers.push({
          ...val,
          qty: 0
        })
        
        decreasingQty -= val.qty // decrasing the value for the next loop

        // handling user balances
        // TODO: if present user buying then the other users qty should get deduct and should add the price of the sold qty
        // the price from the present user should get deduct

        this.deductTotalBalalnceOfUser(
          val.id,
          side,
          finalPrice,
          val.qty,
          false
        );
        this.resetLockBalalnceOfUser(val.id, side);
      } else {
        const leftQty = Math.abs(decreasingQty - val.qty);

        updatedUsers.push({
          ...val,
          qty: leftQty
        })
        
        // handling user balances
        this.deductTotalBalalnceOfUser(
          val.id,
          side,
          finalPrice,
          decreasingQty,
          false
        );
        this.resetLockBalalnceOfUser(val.id, side);
      }
    }

    return updatedUsers;
  } 

  updateInvolvedUsersQtyInOrderBook = (users: UserInOrderBook[], side: orderSide, orderBookKey: number) => {
    const keySide = side === "BUY" ? "asks" : "bids";

    // getting the latest state
    const orderBook = this.USERORDERBOOK["AXIS"][keySide][orderBookKey]!;

    // deleting this one
    delete this.USERORDERBOOK["AXIS"][keySide][orderBookKey];

    // updating the users with the latest one
    const updatedUsers = orderBook.users.concat(users);

    // updating the order book
    this.USERORDERBOOK["AXIS"][keySide][orderBookKey] = {
      ...this.USERORDERBOOK["AXIS"][keySide][orderBookKey]!,
      users: updatedUsers
    }
  }

  creatingFillsForSwap = (updatedUsers: UserInOrderBook[], userId: string, orderId: string) => {
    // TODO: return all the created fills of this code
    const order = this.getOrder(orderId, userId)!;
    
    // find out how to get their idss
    const TODO_ID = crypto.randomUUID();
    
    for (const val of updatedUsers) {
      this.FILLS.push({
        id: crypto.randomUUID(),
        askedQty: order.qty,
        asset: "AXIS",
        createdAt: new Date(),
        filledQty: order.filledQty,
        makerId: val.id,
        makerOrderId: TODO_ID,
        price: order.price,
        side: order.side,
        takerId: userId,
        takerOrderId: orderId,
        type: "TAKER"
      });
    }    
  }

  updateOrder = (userId: string, orderId: string, updatedOrderData: Partial<Order>) => {
    const order = this.getOrder(orderId, userId);
    if (!order) return;

    const updatedOrder = {
      ...order,
      ...updatedOrderData
    }

    this.deleteOrder(userId, order.id);

    this.ORDERS.push(updatedOrder)
  }


  /**
   * 
   * @param side => (asks | bids)
   * @param orderBookKey => price on the which the user get matched
   * @param userQty => quantity asked by the user
   * @param availableQty => available qty in the key
   * @param userId => present user
   * @param finalPrice => price paid by the user
   * @param type => (MARKET | LIMIT)
   * @param users => the user of which qty we are eating
   * @param oldOrderId => is it the same order (looping on it)
   * @returns 
   */
  completeOrder = (
    side: orderSide, 
    orderBookKey: number, 
    userQty: number, 
    availableQty: number, 
    userId: string, 
    finalPrice: number, 
    type: orderType,
    users: UserInOrderBook[],
    orderId: string,
  ) => {
    // const order =
    //   this.ORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey];
    const order =
      this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]!;
      
    // if the same order get repeats for the user
    const existingOrder = this.getOrder(orderId, userId);
      
    if (!existingOrder) {
      this.ORDERS.push({
        id: orderId,
        userId,
        type,
        status: userQty === availableQty ? "FILLED" : "PARTIAL_FILLED",
        filledQty: availableQty,
        qty: userQty,
        price: finalPrice,
        market: "AXIS",
        side,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      this.updateOrder(userId, orderId, {
        updatedAt: new Date(),
        filledQty: availableQty,
        qty: userQty,
        status: userQty === availableQty ? "FILLED" : "PARTIAL_FILLED"
      })
    }

    const updatedUsers = this.deductQtyAndBalanceOfInvolvedUsers(users, availableQty, side, finalPrice);

    // updating the users in the order book
    this.updateInvolvedUsersQtyInOrderBook(updatedUsers, side, orderBookKey);
    
    this.creatingFillsForSwap(updatedUsers, userId, orderId);

    this.USERORDERBOOK.AXIS[side === "BUY" ? "asks" : "bids"][orderBookKey] = {
      ...order,
      totalQuantity: order.totalQuantity - availableQty
    };

    const reFetchedOrder = 
      this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]!
    
    if (reFetchedOrder.totalQuantity === 0) {
      delete this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]
    }
    
    this.USERORDERBOOK["AXIS"].lastTradedPrice = orderBookKey;


    const fills = this.getFills(userId, orderId);
    
    const toSendOrder = this.getOrder(orderId, userId)!;
    
    redisManager.pushDataInOrderQueue({
      type: "create_order",
      data: { order: toSendOrder, fills }
    }, "orderbook-to-db-queue")
    
    // handle balances on the current user
    engineStore.deductTotalBalalnceOfUser(
      userId,
      side,
      finalPrice,
      availableQty,
      true
    );
    engineStore.resetLockBalalnceOfUser(userId, side);

    return { 
      status: userQty === availableQty ? "FILLED" : "PARTIAL_FILLED", 
      orderId, 
      fills,
      filledQty: availableQty,
      averagePrice: finalPrice
    };
  }

  beforeOrder = (parsedResponse: RedisQueueData): EngineResponse => {
    if (parsedResponse.type !== "create_order") return {
      clientId: parsedResponse.clientId,
      ok: false
    }
      
    const { side, symbol, type, userId, price, qty, 
      // market 
    } = parsedResponse.data;

    if (type === "LIMIT") {
      // for limit we need both price and qty (conceptual)
      if (price === undefined || qty === undefined) {
        return {
          clientId: parsedResponse.clientId,
          ok: false,
          error: "Price and quantity both should be defined.",
        };
      }
    } else if (type === "MARKET") {
      // for market any one value is able to find the other one thats why one value should be defined
      if (price === undefined && qty === undefined) {
        return {
          clientId: parsedResponse.clientId,
          ok: false,
          error: "Price and quantity both should be defined.",
        };
      }
    }
    
    // one time more just for making TS happy.
    if (price === undefined || qty === undefined) {
      return {
        clientId: parsedResponse.clientId,
        ok: false,
        error: "Price and quantity both should be defined.",
      };
    }


    // fn for checking does user have balance 
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

    // finding available price from the orderbook
    const availablePrice = engineStore.checkAvailablePriceInOrderBook(
      price,
      "AXIS",
      side === "BUY" ? "asks" : "bids",
    );


    // if price is not available and type is market, means the user want on the spot execution, so will cancel the order
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
    
    // here the type will be LIMI, so we will add it in the orderBook
    if (!availablePrice) {
      this.addNewAsksOrBidsInOrderBook(
        side === "SELL" ? "asks" : "bids",
        price,
        userId,
        "AXIS",
        qty,
      );

      this.ORDERS.push({
        id: parsedResponse.data.orderId,
        userId,
        status: "OPEN",
        market: "AXIS",
        side,
        type,
        price,
        qty,
        filledQty: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      return {
        clientId: parsedResponse.clientId,
        ok: true,
        data: {
          message: "Order added in the order book",
          data: {
            status: "OPEN",
            filledQty: 0,
            averagePrice: null,
            fills: []
          },
        },
      };
    }

    // returning the avilable qty for the further processing
    return {
      clientId: parsedResponse.clientId,
      ok: true,
      data: {
        message: "available price found",
        data: availablePrice
        // data: { market, availablePrice }
      }
    }
  }

  getLastTradingPrice() {
    // return this.ORDERBOOK["AXIS"].lastTradedPrice
    return this.USERORDERBOOK["AXIS"].lastTradedPrice
  }
  
  calculateFinalPriceWithLeverage = (userId: string, price: number, qty: number) => {
    const userBalance = this.getUserBalance(userId);
    
    // 1 = 1x || 2 = 2x and so on
    let leverage = 0;
    let lockedPrice = 0;
    
    const priceAskedByUser = price * qty;
    
    const userActualBalance = userBalance.COLLATERAL.total - userBalance.COLLATERAL.locked; 
    
    if (userActualBalance >= priceAskedByUser) {
      lockedPrice = priceAskedByUser;
      leverage = 1
    } else {
      lockedPrice = userActualBalance
      leverage =  priceAskedByUser / userActualBalance;
    }
    
    this.updatingUserBalance(userId, userBalance.COLLATERAL.total, lockedPrice, "COLLATERAL")

    return { leverage, priceAskedByUser, userActualBalance }
  }


  updatingUserBalance = (userId: string, total: number, locked: number, key: BalanceKey) => {
    const userBalance = this.BALANCES[userId]!;

    const updatedUserBalance: Record<BalanceKey, {
      total: number;
      locked: number;
    }> = {
      ...userBalance,
      [key]: { total, locked }
    }

    this.BALANCES[userId] = updatedUserBalance;
  }

  getUserInvolvedInSwap = (orderBookKey: number, totalQuantity: number, side: orderSide) => {
    let startQty = 0;
    const users: UserInOrderBook[] = [];

    const orderBook = this.USERORDERBOOK["AXIS"][side === "BUY" ? "asks" : "bids"][orderBookKey]!;

    if (startQty >= totalQuantity) return users;
    
    for (const val of orderBook.users) {
      startQty += val.qty
      users.push(val)
    }
  }

  backupData = () => {
    fs.writeFileSync("./orderbook.json", JSON.stringify(this.USERORDERBOOK));      
    fs.writeFileSync("./balances.json", JSON.stringify(this.BALANCES));
  }

  readBackupData = () => {
    try {
      const USERORDERBOOK = JSON.parse(fs.readFileSync("./orderbook.json").toString());
      const BALANCES = JSON.parse(fs.readFileSync("./balances.json").toString());
  
      return { USERORDERBOOK, BALANCES }
    } catch {
      return { 
        USERORDERBOOK: {
          AXIS: { bids: {}, asks: {}, lastTradedPrice: 0 },
          TATA: { bids: {}, asks: {}, lastTradedPrice: 0 },
        }, 
        BALANCES: {} 
      }
    }
  }
  
  testfn = () => {
    return null
  }
}

export const engineStore = EngineStore.getInstance();
