import express from "express";
import cors from "cors";
import { signup } from "./routes/signup";
import { signin } from "./routes/signin";
import { auth } from "./auth";
import { createOrder } from "./routes/create-order";

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

/*
    returns the status of an order (partially filled, success, cancellled)
    ALSO RETURNS THE INDIVIDUAL FILLS OF THIS ORDER 
*/
app.get("/order/:orderId", auth, getSingleOrder);

app.delete("/order/:orderId", auth, deleteSingleOrder);

app.get("/depth/:symbol", getSymbolDepth);

app.get("/orders", auth, getOrders);

app.get("/orders/open", auth, getOpenOrders);

app.get("/fills", auth, getFills);

app.get("/balance/usd", auth, getUsdBalance);

/*  
    Returns the balance of all stocks
*/
app.get("/balance", auth, getBalance);
