/*
  Warnings:

  - A unique constraint covering the columns `[clothId]` on the table `measurements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clothId` to the `measurements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "measurements" ADD COLUMN     "clothId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "measurements_clothId_key" ON "measurements"("clothId");

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_clothId_fkey" FOREIGN KEY ("clothId") REFERENCES "cloths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
