/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `variants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "variants_slug_key" ON "variants"("slug");
