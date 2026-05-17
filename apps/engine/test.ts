import { engineStore } from "./engine-store";

function main() {
  const { reFetchedOrder, reFetchedOrderIdx } = engineStore.testFn()!
  
  console.log(reFetchedOrder)
  console.log(reFetchedOrderIdx)
}


main()
process.exit(0)