import { prisma } from "../config/database.js";

export default class SubjectService {
  async getAllSubjects(options = {}) {
    const {
      includeInactive = false,
      search = "",
      page = 1,
      pageSize = 10,
    } = options;

    return prisma.subject.findMany({
      where: {
        statut: includeInactive ? undefined : "actif",
        OR: search
          ? [
              { nom: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        niveau: { select: { id: true, libelle: true } },
        _count: { select: { teacherSubjects: true, classSubjects: true } },
      },
      orderBy: { nom: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async createSubject(subjectData) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.subject.findFirst({
        where: {
          nom: subjectData.nom,
          niveauId: subjectData.niveauId,
        },
      });
      if (existing) throw new Error("Cette matière existe déjà pour ce niveau");

      return tx.subject.create({
        data: {
          nom: subjectData.nom,
          niveauId: subjectData.niveauId,
          coefficient: subjectData.coefficient,
          description: subjectData.description,
        },
      });
    });
  }

  async updateSubject(subjectId, updateData) {
    return prisma.$transaction(async (tx) => {
      const subject = await tx.subject.findUnique({ where: { id: subjectId } });
      if (!subject) throw new Error("Matière non trouvée");

      if (updateData.nom && updateData.nom !== subject.nom) {
        const nameConflict = await tx.subject.findFirst({
          where: {
            nom: updateData.nom,
            niveauId: updateData.niveauId || subject.niveauId,
            NOT: { id: subjectId },
          },
        });
        if (nameConflict)
          throw new Error("Ce nom est déjà utilisé pour ce niveau");
      }

      return tx.subject.update({
        where: { id: subjectId },
        data: updateData,
      });
    });
  }

  async setSubjectStatus(subjectId, action) {
    const validTransitions = {
      delete: { from: "actif", to: "inactif" },
      restore: { from: "inactif", to: "actif" },
    };

    if (!validTransitions[action]) throw new Error("Action invalide");

    const { from, to } = validTransitions[action];
    return prisma.$transaction(async (tx) => {
      const subject = await tx.subject.findUnique({ where: { id: subjectId } });
      if (!subject) throw new Error("Matière non trouvée");
      if (subject.statut !== from)
        throw new Error(`La matière est déjà ${subject.statut}`);

      return tx.subject.update({
        where: { id: subjectId },
        data: { statut: to },
      });
    });
  }

  async getSubjectById(subjectId) {
    return prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        niveau: true,
        teacherSubjects: {
          include: {
            teacher: {
              include: { user: { select: { nom: true, prenom: true } } },
            },
          },
        },
        classSubjects: {
          include: {
            class: { select: { nom: true } },
          },
        },
      },
    });
  }

  async countSubject(includeInactive = false) {
    return prisma.subject.count({
      where: {
        statut: includeInactive ? undefined : "actif",
      },
    });
  }
}