/*
  Warnings:

  - You are about to drop the column `email_parent` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `nom_parent` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `telephone_parent` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."students" DROP COLUMN "email_parent",
DROP COLUMN "nom_parent",
DROP COLUMN "telephone_parent";
