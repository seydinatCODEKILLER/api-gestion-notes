-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'professeur', 'eleve');

-- CreateEnum
CREATE TYPE "public"."Statut" AS ENUM ('actif', 'inactif');

-- CreateEnum
CREATE TYPE "public"."NoteType" AS ENUM ('devoir', 'composition', 'oral', 'projet');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('note_basse', 'absentéisme', 'comportement');

-- CreateEnum
CREATE TYPE "public"."AlertStatut" AS ENUM ('nouveau', 'en_cours', 'resolu');

-- CreateEnum
CREATE TYPE "public"."AlertPriorite" AS ENUM ('faible', 'moyenne', 'haute');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "adresse" TEXT,
    "telephone" VARCHAR(255) NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'eleve',
    "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "public"."Statut" NOT NULL DEFAULT 'actif',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."niveaux" (
    "id" SERIAL NOT NULL,
    "libelle" VARCHAR(50) NOT NULL,

    CONSTRAINT "niveaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."classes" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(50) NOT NULL,
    "niveauId" INTEGER NOT NULL,
    "annee_scolaire" VARCHAR(20) NOT NULL,
    "capacite_max" INTEGER,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "classId" INTEGER,
    "date_naissance" DATE,
    "lieu_naissance" VARCHAR(100),
    "adresse" TEXT,
    "avatar" TEXT,
    "telephone" VARCHAR(20),
    "nom_parent" VARCHAR(100),
    "telephone_parent" VARCHAR(20),
    "email_parent" VARCHAR(255),
    "date_inscription" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subjects" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "niveauId" INTEGER NOT NULL,
    "coefficient" DECIMAL(3,1) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teachers" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date_embauche" DATE,
    "specialite" VARCHAR(100),

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grades" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "note" DECIMAL(4,2),
    "coefficient" DECIMAL(3,1) NOT NULL,
    "type_note" "public"."NoteType" NOT NULL,
    "trimestreId" INTEGER NOT NULL,
    "date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,
    "anneeScolaireId" INTEGER NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."averages" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "trimestreId" INTEGER NOT NULL,
    "moyenne" DECIMAL(4,2) NOT NULL,
    "rang" INTEGER,
    "appreciation" TEXT,
    "anneeScolaireId" INTEGER NOT NULL,

    CONSTRAINT "averages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_cards" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "trimestreId" INTEGER NOT NULL,
    "moyenne_generale" DECIMAL(4,2) NOT NULL,
    "rang_classe" INTEGER,
    "appreciation_generale" TEXT,
    "date_edition" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chemin_fichier" TEXT NOT NULL,
    "anneeScolaireId" INTEGER NOT NULL,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_subjects" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "coefficient" DECIMAL(3,1) NOT NULL,
    "anneeScolaireId" INTEGER NOT NULL,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teacher_subjects" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "subjectId" INTEGER,
    "trimestre" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "public"."AlertStatut" NOT NULL DEFAULT 'nouveau',
    "priorite" "public"."AlertPriorite" NOT NULL DEFAULT 'moyenne',

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."annee_scolaire" (
    "id" SERIAL NOT NULL,
    "libelle" VARCHAR(20) NOT NULL,

    CONSTRAINT "annee_scolaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trimestres" (
    "id" SERIAL NOT NULL,
    "libelle" VARCHAR(10) NOT NULL,
    "anneeScolaireId" INTEGER NOT NULL,

    CONSTRAINT "trimestres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telephone_key" ON "public"."users"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "public"."students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "public"."teachers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacherId_subjectId_key" ON "public"."teacher_subjects"("teacherId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "annee_scolaire_libelle_key" ON "public"."annee_scolaire"("libelle");

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "public"."niveaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "public"."niveaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grades" ADD CONSTRAINT "grades_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grades" ADD CONSTRAINT "grades_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grades" ADD CONSTRAINT "grades_trimestreId_fkey" FOREIGN KEY ("trimestreId") REFERENCES "public"."trimestres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grades" ADD CONSTRAINT "grades_anneeScolaireId_fkey" FOREIGN KEY ("anneeScolaireId") REFERENCES "public"."annee_scolaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."averages" ADD CONSTRAINT "averages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."averages" ADD CONSTRAINT "averages_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."averages" ADD CONSTRAINT "averages_trimestreId_fkey" FOREIGN KEY ("trimestreId") REFERENCES "public"."trimestres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."averages" ADD CONSTRAINT "averages_anneeScolaireId_fkey" FOREIGN KEY ("anneeScolaireId") REFERENCES "public"."annee_scolaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_cards" ADD CONSTRAINT "report_cards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_cards" ADD CONSTRAINT "report_cards_trimestreId_fkey" FOREIGN KEY ("trimestreId") REFERENCES "public"."trimestres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_cards" ADD CONSTRAINT "report_cards_anneeScolaireId_fkey" FOREIGN KEY ("anneeScolaireId") REFERENCES "public"."annee_scolaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_subjects" ADD CONSTRAINT "class_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_subjects" ADD CONSTRAINT "class_subjects_anneeScolaireId_fkey" FOREIGN KEY ("anneeScolaireId") REFERENCES "public"."annee_scolaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_subjects" ADD CONSTRAINT "teacher_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trimestres" ADD CONSTRAINT "trimestres_anneeScolaireId_fkey" FOREIGN KEY ("anneeScolaireId") REFERENCES "public"."annee_scolaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
