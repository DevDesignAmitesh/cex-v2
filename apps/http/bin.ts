import os from "os";
import cluster from "cluster";
import { app } from ".";

const cpus = os.cpus().length;

if (process.env.NODE_ENV === "production") {
  if (cluster.isPrimary) {
    for (let i = 0; i < cpus; i++) {
      cluster.fork();
    }
    cluster.on("exit", () => cluster.fork())
  } else {
    app.listen(4000, () => console.log("code is running at 4000"))
  }
  
} else {
  
  app.listen(4000, () => console.log("code is running at 4000"))
}

