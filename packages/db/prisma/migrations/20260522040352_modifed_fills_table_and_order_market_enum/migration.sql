/*
  Warnings:

  - The values [SOL] on the enum `orderMarket` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "orderMarket_new" AS ENUM ('AXIS', 'TATA');
ALTER TABLE "Order" ALTER COLUMN "market" TYPE "orderMarket_new" USING ("market"::text::"orderMarket_new");
ALTER TYPE "orderMarket" RENAME TO "orderMarket_old";
ALTER TYPE "orderMarket_new" RENAME TO "orderMarket";
DROP TYPE "public"."orderMarket_old";
COMMIT;
