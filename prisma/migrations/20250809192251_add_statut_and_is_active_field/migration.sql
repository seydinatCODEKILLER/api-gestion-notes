-- AlterTable
ALTER TABLE "public"."annee_scolaire" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."classes" ADD COLUMN     "statut" "public"."Statut" NOT NULL DEFAULT 'actif';

-- AlterTable
ALTER TABLE "public"."niveaux" ADD COLUMN     "statut" "public"."Statut" NOT NULL DEFAULT 'actif';
