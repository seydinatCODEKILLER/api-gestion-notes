/*
  Warnings:

  - You are about to drop the column `commentaire` on the `grades` table. All the data in the column will be lost.
  - You are about to drop the `_EvaluationToGrade` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `evaluationId` to the `grades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_EvaluationToGrade" DROP CONSTRAINT "_EvaluationToGrade_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_EvaluationToGrade" DROP CONSTRAINT "_EvaluationToGrade_B_fkey";

-- AlterTable
ALTER TABLE "public"."grades" DROP COLUMN "commentaire",
ADD COLUMN     "evaluationId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."_EvaluationToGrade";

-- AddForeignKey
ALTER TABLE "public"."grades" ADD CONSTRAINT "grades_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "public"."evaluations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
