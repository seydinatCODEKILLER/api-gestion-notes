/*
  Warnings:

  - A unique constraint covering the columns `[studentId,subjectId,trimestreId]` on the table `averages` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "averages_studentId_subjectId_trimestreId_key" ON "public"."averages"("studentId", "subjectId", "trimestreId");
