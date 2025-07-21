-- AlterTable
ALTER TABLE "items" ADD COLUMN     "colors" TEXT[],
ADD COLUMN     "release_date" TIMESTAMP(3),
ADD COLUMN     "release_week" TEXT,
ADD COLUMN     "retail_usd" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "item_images" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,

    CONSTRAINT "item_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_images_item_id_idx_key" ON "item_images"("item_id", "idx");

-- AddForeignKey
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
