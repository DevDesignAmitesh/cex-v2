export function getBalanceFromStockExchange() {
  const prices = [64, 65, 66, 67];
  
  return prices[Math.floor(Math.random() * prices.length)]!
}

getBalanceFromStockExchange()