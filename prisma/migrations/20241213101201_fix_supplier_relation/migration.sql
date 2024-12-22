/*
  Warnings:

  - You are about to drop the column `supplierAddress` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `supplierEmail` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `supplierName` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `supplierPhone` on the `Invoice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_supplierName_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "supplierAddress",
DROP COLUMN "supplierEmail",
DROP COLUMN "supplierName",
DROP COLUMN "supplierPhone",
ADD COLUMN     "supplierId" TEXT;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
