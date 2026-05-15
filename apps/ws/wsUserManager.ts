import type { OrderBook } from "@repo/common/common";
import { WebSocket } from "ws"

class WsUserManager {
  private static instance: WsUserManager
  private users: WebSocket[]

  constructor() {
    this.users = []
  }

  static getInstance(): WsUserManager {
    if (!WsUserManager.instance) WsUserManager.instance = new WsUserManager();
    return WsUserManager.instance
  }
  
  add(user: WebSocket) {
    this.users.push(user)
  }

  remove(user: WebSocket) {
    const userIndex = this.users.findIndex((usr) => usr === user);
    if (userIndex === -1) return;

    this.users.splice(userIndex, 0)
  }

  broadcast(data: OrderBook) {
    let arrayBasedOrderBook: {
      asks: {key: string, value: number }[]
      bids: {key: string, value: number }[]
      lastTradedPrice: number
    } = {
      asks: [],
      bids: [],
      lastTradedPrice: 0
    }
    
    Object.entries(data.AXIS).map(([key, value]) => {
      arrayBasedOrderBook.lastTradedPrice = (value as number)
    })

    Object.entries(data.AXIS.asks).map(([key, value]) => {
      arrayBasedOrderBook.asks.push({
        key,
        value: value.totalQuantity
      })
    })
    
    
    Object.entries(data.AXIS.bids).map(([key, value]) => {
      arrayBasedOrderBook.bids.push({
        key,
        value: value.totalQuantity
      })
    })
    
    this.users.forEach((usr) => {
      usr.send(JSON.stringify({
        type: "order_book",
        data: arrayBasedOrderBook
      }))
    })
  }
  
}

export const wsUserManager = WsUserManager.getInstance();