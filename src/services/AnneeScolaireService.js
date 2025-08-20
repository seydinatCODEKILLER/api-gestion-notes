import { prisma } from "../config/database.js";

export default class AnneeScolaireService {
  async getAllAnnees(options = {}) {
    const {
      includeInactive = false,
      search = "",
      page = 1,
      pageSize = 10,
    } = options;

    return prisma.anneeScolaire.findMany({
      where: {
        libelle: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      orderBy: {
        libelle: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countAnnees() {
    return prisma.anneeScolaire.count();
  }

  async createAnnee(anneeData) {
    return prisma.$transaction(async (tx) => {
      // Vérifier si l'année existe déjà
      const existing = await tx.anneeScolaire.findUnique({
        where: { libelle: anneeData.libelle },
      });
      if (existing) throw new Error("Cette année scolaire existe déjà");

      return tx.anneeScolaire.create({
        data: {
          libelle: anneeData.libelle,
        },
      });
    });
  }

  async updateAnnee(anneeId, updateData) {
    return prisma.$transaction(async (tx) => {
      const annee = await tx.anneeScolaire.findUnique({
        where: { id: anneeId },
      });
      if (!annee) throw new Error("Année scolaire non trouvée");

      if (updateData.libelle && updateData.libelle !== annee.libelle) {
        const existing = await tx.anneeScolaire.findUnique({
          where: { libelle: updateData.libelle },
        });
        if (existing) throw new Error("Cette année scolaire existe déjà");
      }

      return tx.anneeScolaire.update({
        where: { id: anneeId },
        data: updateData,
      });
    });
  }

  async getActiveAnnee() {
    return prisma.anneeScolaire.findFirst({
      where: { statut: "actif" },
    });
  }

  async getAnneeById(anneeId) {
    return prisma.anneeScolaire.findUnique({
      where: { id: anneeId },
      include: {
        trimestres: true,
        classSubjects: {
          include: {
            class: true,
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    nom: true,
                    prenom: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async setAnneeStatus(anneeId, action) {
    const validTransitions = {
      restore: { from: "inactif", to: "actif" },
      delete: { from: "actif", to: "inactif" },
    };

    if (!validTransitions[action]) {
      throw new Error("Action invalide. Utilisez 'delete' ou 'restore'");
    }

    const { from, to } = validTransitions[action];

    return prisma.$transaction(async (tx) => {
      const annee = await tx.anneeScolaire.findUnique({
        where: { id: anneeId },
      });

      if (!annee) throw new Error("Année scolaire non trouvée");
      if (annee.statut !== from) {
        throw new Error(`Action impossible: l'année est ${annee.statut}`);
      }

      if (to === "actif") {
        await tx.anneeScolaire.updateMany({
          where: { statut: "actif" },
          data: { statut: "inactif" },
        });
      }

      return tx.anneeScolaire.update({
        where: { id: anneeId },
        data: { statut: to },
      });
    });
  }
}
