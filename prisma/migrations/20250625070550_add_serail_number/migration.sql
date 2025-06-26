/*
  Warnings:

  - A unique constraint covering the columns `[serialNumber]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serialNumber]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serialNumber]` on the table `shops` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "serialNumber" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "serialNumber" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "serialNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customers_serialNumber_key" ON "customers"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_serialNumber_key" ON "orders"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "shops_serialNumber_key" ON "shops"("serialNumber");
