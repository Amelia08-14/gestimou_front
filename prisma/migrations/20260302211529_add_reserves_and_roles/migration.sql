-- CreateTable
CREATE TABLE `Reserve` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NULL,
    `propertyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reserve` ADD CONSTRAINT `Reserve_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
