// for (;;) {
//   let counter = -1;
  
//   if (counter < 0) break;
//   if ( counter < 0) console.log("hii")
//   console.log(counter - Number("a"))
//   break;
// }

// console.log("hello")


type OrderBookKey = "AXIS"

let orderBook: Record<
OrderBookKey,
  {
    bids: Record<
      string,
      {
        totalQuantity: number;
      }
    >;
    asks: Record<
      string,
      {
        totalQuantity: number;
      }
    >;
    lastTradedPrice: number;
  }
> = {
  AXIS: { bids: {
    "11-user1": {
      totalQuantity: 1,
    },
  }, asks: {
    "20-user2": {
      totalQuantity: 1,
    },
  }, lastTradedPrice: 100 },
}

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
}

Object.entries(orderBook["AXIS"]).map((data) => {
  const key = data[0];
  const value = data[1];

  if (key !== "lastTradedPrice") return;
  
  finalOrderBookWithUserBasedDepth.AXIS = {
    ...finalOrderBookWithUserBasedDepth.AXIS,
    lastTradedPrice: (value as number)
  }
})

Object.entries(orderBook["AXIS"].asks).map((data) => {
  const orderBookKey = data[0]
  const price = orderBookKey.split("-")[0]!;
  const userId = orderBookKey.split("-")[1]!;  
  const value = orderBook["AXIS"].asks[orderBookKey]

  finalOrderBookWithUserBasedDepth.AXIS.asks[price] = {
    ...finalOrderBookWithUserBasedDepth.AXIS.asks[price],
    totalQuantity: value.totalQuantity,
    userId
  }
});

Object.entries(orderBook["AXIS"].bids).map((data) => {
  const orderBookKey = data[0]
  const price = orderBookKey.split("-")[0]!;
  const userId = orderBookKey.split("-")[1]!;
  const value = orderBook["AXIS"].bids[orderBookKey]

  finalOrderBookWithUserBasedDepth.AXIS.bids[price] = {
    ...finalOrderBookWithUserBasedDepth.AXIS.bids[price],
    totalQuantity: value.totalQuantity,
    userId
  }
});

// Object.entries(finalOrderBookWithUserBasedDepth["AXIS"].bids).map((data) => {
//   console.log("data in bids ", data)
// });

console.log("finalOrderBookWithUserBasedDepth ", finalOrderBookWithUserBasedDepth)