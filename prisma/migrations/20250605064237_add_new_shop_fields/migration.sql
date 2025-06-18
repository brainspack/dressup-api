/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `shops` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "shops_phone_key" ON "shops"("phone");
