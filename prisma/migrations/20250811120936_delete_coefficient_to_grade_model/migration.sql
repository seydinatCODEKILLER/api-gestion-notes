/*
  Warnings:

  - You are about to drop the column `coefficient` on the `grades` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."grades" DROP COLUMN "coefficient";

-- AlterTable
ALTER TABLE "public"."trimestres" ADD COLUMN     "statut" "public"."Statut" NOT NULL DEFAULT 'actif';
