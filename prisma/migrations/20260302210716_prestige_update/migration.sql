/*
  Warnings:

  - You are about to drop the column `property` on the `financialtransaction` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `FinancialTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `financialtransaction` DROP COLUMN `property`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `propertyId` INTEGER NULL,
    ADD COLUMN `residenceId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `maintenanceticket` ADD COLUMN `category` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `FinancialTransaction` ADD CONSTRAINT `FinancialTransaction_residenceId_fkey` FOREIGN KEY (`residenceId`) REFERENCES `Residence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialTransaction` ADD CONSTRAINT `FinancialTransaction_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
