-- CreateTable
CREATE TABLE "public"."GradeUpdateTrack" (
    "id" SERIAL NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "trimestreId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeUpdateTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeUpdateTrack_studentId_subjectId_trimestreId_idx" ON "public"."GradeUpdateTrack"("studentId", "subjectId", "trimestreId");
