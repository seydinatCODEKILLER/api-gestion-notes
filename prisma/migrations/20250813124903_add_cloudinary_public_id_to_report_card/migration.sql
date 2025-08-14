/*
  Warnings:

  - Added the required column `cloudinary_public_id` to the `report_cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."report_cards" ADD COLUMN     "cloudinary_public_id" TEXT NOT NULL;
