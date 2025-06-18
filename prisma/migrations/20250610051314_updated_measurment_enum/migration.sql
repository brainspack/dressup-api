-- AlterTable
ALTER TABLE "measurements" ADD COLUMN     "orderId" TEXT;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
