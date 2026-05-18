import { engineStore } from "./engine-store";

function main() {
  const res = engineStore.testfn()!
  
  console.log(res)
}


main()
process.exit(0)