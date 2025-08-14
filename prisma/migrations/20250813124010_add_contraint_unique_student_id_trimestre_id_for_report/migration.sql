/*
  Warnings:

  - You are about to drop the column `trimestre` on the `alerts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,trimestreId]` on the table `report_cards` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."alerts" DROP COLUMN "trimestre",
ADD COLUMN     "trimestreId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_studentId_trimestreId_key" ON "public"."report_cards"("studentId", "trimestreId");

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_trimestreId_fkey" FOREIGN KEY ("trimestreId") REFERENCES "public"."trimestres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
