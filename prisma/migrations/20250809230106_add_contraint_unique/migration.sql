/*
  Warnings:

  - A unique constraint covering the columns `[nom]` on the table `classes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[libelle]` on the table `niveaux` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "classes_nom_key" ON "public"."classes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "niveaux_libelle_key" ON "public"."niveaux"("libelle");
