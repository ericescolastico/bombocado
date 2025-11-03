/*
  Warnings:

  - You are about to drop the `consumers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."consumers" DROP CONSTRAINT "consumers_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_consumerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_createdById_fkey";

-- DropTable
DROP TABLE "public"."consumers";

-- DropTable
DROP TABLE "public"."order_items";

-- DropTable
DROP TABLE "public"."orders";

-- DropTable
DROP TABLE "public"."products";

-- DropEnum
DROP TYPE "public"."DocType";

-- DropEnum
DROP TYPE "public"."OrderStatus";

-- DropEnum
DROP TYPE "public"."PaymentMethod";
