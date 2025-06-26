/*
  Warnings:

  - A unique constraint covering the columns `[serialNumber]` on the table `tailors` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tailors" ADD COLUMN     "serialNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tailors_serialNumber_key" ON "tailors"("serialNumber");
