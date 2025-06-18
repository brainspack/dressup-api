/*
  Warnings:

  - A unique constraint covering the columns `[mobileNumber]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "customers_mobileNumber_key" ON "customers"("mobileNumber");
