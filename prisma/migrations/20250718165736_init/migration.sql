-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('stockx', 'goat', 'grailed');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('ask', 'bid', 'last');

-- CreateEnum
CREATE TYPE "AlertCondition" AS ENUM ('above', 'below', 'equal');

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT 'Supreme',
    "image_url" TEXT,
    "season" TEXT,
    "style_code" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "price_usd" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "ask_or_bid" "PriceType" NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "platform" "Platform",
    "target_price" DECIMAL(10,2) NOT NULL,
    "condition" "AlertCondition" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_slug_key" ON "items"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "variants_item_id_size_color_key" ON "variants"("item_id", "size", "color");

-- CreateIndex
CREATE INDEX "prices_variant_id_platform_captured_at_idx" ON "prices"("variant_id", "platform", "captured_at");

-- CreateIndex
CREATE INDEX "prices_captured_at_idx" ON "prices"("captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_user_id_variant_id_key" ON "watchlist"("user_id", "variant_id");

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
