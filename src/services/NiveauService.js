import { prisma } from "../config/database.js";

export default class NiveauService {
  async getAllNiveaux(options = {}) {
    const {
      includeInactive = false,
      search = "",
      page = 1,
      pageSize = 10,
    } = options;

    return prisma.niveau.findMany({
      where: {
        statut: includeInactive ? undefined : "actif",
        libelle: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      orderBy: {
        libelle: "asc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countNiveaux(includeInactive = false) {
    return prisma.niveau.count({
      where: {
        statut: includeInactive ? undefined : "actif",
      },
    });
  }

  async createNiveau(niveauData) {
    const { libelle } = niveauData;    

    const existing = await prisma.niveau.findUnique({
      where: { libelle },
    });
    if (existing) throw new Error("Le libellé existe déjà");

    return prisma.niveau.create({
      data: {libelle},
    });
  }

  async updateNiveau(id, updateData) {
    const niveau = await prisma.niveau.findUnique({
      where: { id },
    });
    if (!niveau) throw new Error("Niveau non trouvé");

    if (updateData.libelle && updateData.libelle !== niveau.libelle) {
      const existing = await prisma.niveau.findUnique({
        where: { libelle: updateData.libelle },
      });
      if (existing) throw new Error("Le libellé existe déjà");
    }

    return prisma.niveau.update({
      where: { id },
      data: updateData,
    });
  }

  async setNiveauStatus(id, action) {
    const validTransitions = {
      restore: { from: "inactif", to: "actif" },
      delete: { from: "actif", to: "inactif" },
    };
    if (!validTransitions[action])
      throw new Error("Action invalide. Utilisez 'delete' ou 'restore'");

    const { from, to } = validTransitions[action];

    const niveau = await prisma.niveau.findUnique({ where: { id } });
    if (!niveau) throw new Error("Niveau non trouvé");
    if (niveau.statut !== from)
      throw new Error(`Action impossible : le niveau est ${niveau.statut}`);

    return prisma.niveau.update({
      where: { id },
      data: { statut: to },
    });
  }

  async getNiveauById(id) {
    return prisma.niveau.findUnique({
      where: { id },
      include: {
        classes: true,
        subjects: true,
      },
    });
  }
}
