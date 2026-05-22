/*
  Warnings:

  - You are about to drop the column `orderId` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `Fill` table. All the data in the column will be lost.
  - Added the required column `askedQty` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `asset` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filledQty` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makerId` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makerOrderId` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `takerId` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `takerOrderId` to the `Fill` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Fill" DROP CONSTRAINT "Fill_orderId_fkey";

-- AlterTable
ALTER TABLE "Fill" DROP COLUMN "orderId",
DROP COLUMN "qty",
ADD COLUMN     "askedQty" INTEGER NOT NULL,
ADD COLUMN     "asset" "orderMarket" NOT NULL,
ADD COLUMN     "filledQty" INTEGER NOT NULL,
ADD COLUMN     "makerId" TEXT NOT NULL,
ADD COLUMN     "makerOrderId" TEXT NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "takerId" TEXT NOT NULL,
ADD COLUMN     "takerOrderId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_takerId_fkey" FOREIGN KEY ("takerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_makerOrderId_fkey" FOREIGN KEY ("makerOrderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_takerOrderId_fkey" FOREIGN KEY ("takerOrderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
