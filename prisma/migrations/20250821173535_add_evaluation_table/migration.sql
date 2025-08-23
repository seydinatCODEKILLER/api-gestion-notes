-- CreateTable
CREATE TABLE "public"."evaluations" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "type" "public"."NoteType" NOT NULL,
    "titre" TEXT NOT NULL,
    "date_evaluation" TIMESTAMP(3) NOT NULL,
    "anneeScolaireId" INTEGER NOT NULL,
    "trimestreId" INTEGER NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_EvaluationToGrade" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_EvaluationToGrade_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EvaluationToGrade_B_index" ON "public"."_EvaluationToGrade"("B");

-- AddForeignKey
ALTER TABLE "public"."evaluations" ADD CONSTRAINT "evaluations_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluations" ADD CONSTRAINT "evaluations_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluations" ADD CONSTRAINT "evaluations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluations" ADD CONSTRAINT "evaluations_anneeScolaireId_fkey" FOREIGN KEY ("anneeScolaireId") REFERENCES "public"."annee_scolaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluations" ADD CONSTRAINT "evaluations_trimestreId_fkey" FOREIGN KEY ("trimestreId") REFERENCES "public"."trimestres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EvaluationToGrade" ADD CONSTRAINT "_EvaluationToGrade_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EvaluationToGrade" ADD CONSTRAINT "_EvaluationToGrade_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
