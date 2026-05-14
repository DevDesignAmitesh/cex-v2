import express from "express";
import cors from "cors";
import { signup } from "./routes/signup";
import { signin } from "./routes/signin";
import { auth } from "./auth";
import { createOrder } from "./routes/create-order";
import { deleteSingleOrder } from "./routes/delete-single-order";
import { getSingleOrder } from "./routes/get-single-order";
import { getSymbolDepth } from "./routes/get-symbol-depth";
import { getOrders } from "./routes/get-orders";
import { getFills } from "./routes/get-fills";
import { getBalance } from "./routes/get-balance";

export const app = express();

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

app.get("/", (_req, res) => {
  res.send("ok");
});

app.post("/signup", signup);

app.post("/signin", signin);

app.post("/order", auth, createOrder);

app.get("/order/:orderId", auth, getSingleOrder);

app.delete("/order/:orderId", auth, deleteSingleOrder);

app.get("/depth/:symbol", getSymbolDepth);

app.get("/orders", auth, getOrders);

app.get("/fills", auth, getFills);

app.get("/balance", auth, getBalance);
