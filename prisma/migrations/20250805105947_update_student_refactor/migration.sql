/*
  Warnings:

  - You are about to drop the column `adresse` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `telephone` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."students" DROP COLUMN "adresse",
DROP COLUMN "avatar",
DROP COLUMN "telephone";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "avatar" TEXT;
