/*
  Warnings:

  - A unique constraint covering the columns `[stockx_product_id]` on the table `items` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "items" ADD COLUMN     "stockx_product_id" TEXT;

-- CreateTable
CREATE TABLE "stockx_prices" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "size" TEXT,
    "type" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stockx_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stockx_prices_item_id_fetched_at_idx" ON "stockx_prices"("item_id", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "items_stockx_product_id_key" ON "items"("stockx_product_id");

-- AddForeignKey
ALTER TABLE "stockx_prices" ADD CONSTRAINT "stockx_prices_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
