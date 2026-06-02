import { type UserBasedOrderBook } from "@repo/common/common";
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

  broadcastOrderBook(orderbook: UserBasedOrderBook) {
    console.log("data getting recevied in broadcast", orderbook)
    
    let orderbookToSend: {
      asks: { price: number, qty: number }[]
      bids: { price: number, qty: number }[]
      lastTradedPrice: number
    } = {
      asks: [],
      bids: [],
      lastTradedPrice: 0
    }
    
    Object.entries(orderbook.AXIS).map(([key, value]) => {
      orderbookToSend.lastTradedPrice = (value as number)
    })

    Object.entries(orderbook.AXIS.asks).map(([key, value]) => {
      orderbookToSend.asks.push({
        price: Number(key),
        qty: value.totalQuantity,
      })
    })

    Object.entries(orderbook.AXIS.bids).map(([key, value]) => {
      orderbookToSend.bids.push({
        price: Number(key),
        qty: value.totalQuantity,
      })
    })
    
    
    console.log("data to send from orderbook", orderbookToSend)
    
    this.users.forEach((usr) => {
      usr.send(JSON.stringify({
        type: "order_book",
        data: orderbookToSend
      }))
    })
  }
  
}

export const wsUserManager = WsUserManager.getInstance();