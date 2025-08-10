/*
  Warnings:

  - You are about to drop the column `annee_scolaire` on the `classes` table. All the data in the column will be lost.
  - Added the required column `anneeScolaireId` to the `classes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."classes" DROP COLUMN "annee_scolaire",
ADD COLUMN     "anneeScolaireId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_anneeScolaireId_fkey" FOREIGN KEY ("anneeScolaireId") REFERENCES "public"."annee_scolaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
