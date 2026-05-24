-- CreateEnum
CREATE TYPE "positionType" AS ENUM ('LONG', 'SHORT');

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "averagePrice" INTEGER NOT NULL,
    "isProfit" BOOLEAN NOT NULL,
    "liquidationPrice" INTEGER NOT NULL,
    "margin" INTEGER NOT NULL,
    "market" "orderMarket" NOT NULL,
    "pnl" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "type" "positionType" NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
