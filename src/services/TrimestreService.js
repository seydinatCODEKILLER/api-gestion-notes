import { prisma } from "../config/database.js";

export default class TrimestreService {

  async getAllTrimestres(options = {}) {
    const {
      includeInactive = false,
      search = "",
      page = 1,
      pageSize = 10,
      anneeScolaireId,
    } = options;

    return prisma.trimestre.findMany({
      where: {
        statut: includeInactive ? undefined : "actif",
        libelle: search ? { contains: search, mode: "insensitive" } : undefined,
        anneeScolaireId: anneeScolaireId || undefined,
      },
      orderBy: [{ annee_scolaire: { libelle: "asc" } }, { libelle: "asc" }],
      include: {
        annee_scolaire: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countTrimestres(includeInactive = false, anneeScolaireId = undefined) {
    return prisma.trimestre.count({
      where: {
        statut: includeInactive ? undefined : "actif",
        anneeScolaireId: anneeScolaireId || undefined,
      },
    });
  }

  async createTrimestre(trimestreData) {
    const { libelle, anneeScolaireId } = trimestreData;

    const existing = await prisma.trimestre.findFirst({
      where: {
        libelle,
        anneeScolaireId,
      },
    });
    if (existing)
      throw new Error(
        "Un trimestre avec ce libellé existe déjà pour cette année scolaire"
      );

    return prisma.trimestre.create({
      data: trimestreData,
      include: {
        annee_scolaire: true,
      },
    });
  }

  async updateTrimestre(id, updateData) {
    const trimestre = await prisma.trimestre.findUnique({
      where: { id },
    });
    if (!trimestre) throw new Error("Trimestre introuvable");

    if (updateData.libelle && updateData.libelle !== trimestre.libelle) {
      const existing = await prisma.trimestre.findFirst({
        where: {
          libelle: updateData.libelle,
          anneeScolaireId: trimestre.anneeScolaireId,
          NOT: { id },
        },
      });
      if (existing)
        throw new Error(
          "Un trimestre avec ce libellé existe déjà pour cette année scolaire"
        );
    }
    
    return prisma.trimestre.update({
      where: { id },
      data: updateData,
      include: {
        annee_scolaire: true,
      },
    });
  }

  async setTrimestreStatus(id, action) {
    const validTransitions = {
      restore: { from: "inactif", to: "actif" },
      delete: { from: "actif", to: "inactif" },
    };
    if (!validTransitions[action])
      throw new Error("Action invalide. Utilisez 'delete' ou 'restore'");

    const { from, to } = validTransitions[action];

    const trimestre = await prisma.trimestre.findUnique({
      where: { id },
      include: {
        annee_scolaire: true,
      },
    });
    if (!trimestre) throw new Error("Trimestre introuvable");
    if (trimestre.statut !== from)
      throw new Error(
        `Action impossible : le trimestre est ${trimestre.statut}`
      );

    // Si activation, désactiver les autres trimestres de la même année
    if (to === "actif") {
      await prisma.trimestre.updateMany({
        where: {
          anneeScolaireId: trimestre.anneeScolaireId,
          id: { not: id },
        },
        data: { statut: "inactif" },
      });
    }

    return prisma.trimestre.update({
      where: { id },
      data: { statut: to },
      include: {
        annee_scolaire: true,
      },
    });
  }

  async getTrimestreById(id) {
    return prisma.trimestre.findUnique({
      where: { id },
      include: {
        annee_scolaire: true,
        grades: true,
        averages: true,
        reportCards: true,
      },
    });
  }

  async getCurrentTrimestre() {
    return prisma.trimestre.findFirst({
      where: { statut: "actif" },
      include: {
        annee_scolaire: true,
      },
    });
  }
}
