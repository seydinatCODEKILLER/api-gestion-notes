/*
  Warnings:

  - You are about to drop the column `cloudinary_public_id` on the `report_cards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."report_cards" DROP COLUMN "cloudinary_public_id";
