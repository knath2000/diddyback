/*
  Warnings:

  - You are about to drop the column `stockx_product_id` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `item_id` on the `stockx_prices` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `stockx_prices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stockx_product_id]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `variant_id` to the `stockx_prices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "stockx_prices" DROP CONSTRAINT "stockx_prices_item_id_fkey";

-- DropIndex
DROP INDEX "items_stockx_product_id_key";

-- DropIndex
DROP INDEX "stockx_prices_item_id_fetched_at_idx";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "stockx_product_id";

-- AlterTable
ALTER TABLE "stockx_prices" DROP COLUMN "item_id",
DROP COLUMN "size",
ADD COLUMN     "variant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "stockx_product_id" TEXT;

-- CreateIndex
CREATE INDEX "stockx_prices_variant_id_fetched_at_idx" ON "stockx_prices"("variant_id", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_stockx_product_id_key" ON "variants"("stockx_product_id");

-- AddForeignKey
ALTER TABLE "stockx_prices" ADD CONSTRAINT "stockx_prices_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
