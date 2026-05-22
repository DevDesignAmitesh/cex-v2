import { engineStore } from "@repo/engine/engine";
import { getBalanceFromStockExchange } from "./utils";
import type { postionType } from "@repo/common/common";

function checkLiquidation() {
  try {
    // getting the price from the binance / mock server (for eg 80)
    const CURRENT_PRICE = getBalanceFromStockExchange();

    // comparing the liquidation price of all the users ( less than or equal to 80 )
    const POSITIONS_MAPS = engineStore.getAllPositionsMaps();
    
    // in the case of LONG if the current_price is less or equal to the liquidatePrice then liquidate 
    for (const [key, val] of Object.entries(POSITIONS_MAPS["LONG"])) {
      const POSITION_LIQUIDATE_PRICE = Number(key);
      
      if (CURRENT_PRICE <= POSITION_LIQUIDATE_PRICE) liquidate(val, "LONG");
    }
    
    // in the case of LONG if the current_price is more or equal to the liquidatePrice then liquidate 
    for (const [key, val] of Object.entries(POSITIONS_MAPS["SHORT"])) {
      const POSITION_LIQUIDATE_PRICE = Number(key);

      if (CURRENT_PRICE >= POSITION_LIQUIDATE_PRICE) liquidate(val, "SHORT");
    }
  } catch (e) {
    console.log("error in liquidation worker", e);
  }
}

checkLiquidation()

async function liquidate(userIds: string[], type: postionType) {
  console.log("running", userIds, type)
}