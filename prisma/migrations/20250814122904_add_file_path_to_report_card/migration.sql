/*
  Warnings:

  - Added the required column `file_path` to the `report_cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."report_cards" ADD COLUMN     "file_path" TEXT NOT NULL;
