import { prisma } from "../config/database.js";

export default class ClassService {
  
  async getAllClasses(options = {}) {
    const {
      includeInactive = false,
      search = "",
      page = 1,
      pageSize = 10,
    } = options;

    return prisma.class.findMany({
      where: {
        statut: includeInactive ? undefined : "actif",
        OR: search
          ? [
              { nom: { contains: search, mode: "insensitive" } },
              {
                anneeScolaire: {
                  libelle: { contains: search, mode: "insensitive" },
                },
              },
            ]
          : undefined,
      },
      include: {
        niveau: { select: { id: true, libelle: true } },
        anneeScolaire: { select: { id: true, libelle: true } },
        _count: { select: { students: true } },
      },
      orderBy: { nom: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countClasse(includeInactive = false) {
    return prisma.class.count({
      where: {
        statut: includeInactive ? undefined : "actif",
      },
    });
  }

  async createClass(classData) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.class.findFirst({
        where: {
          nom: classData.nom,
          anneeScolaireId: classData.anneeScolaireId,
        },
      });
      if (existing)
        throw new Error(
          "Une classe avec ce nom existe déjà pour cette année scolaire"
        );

      return tx.class.create({
        data: {
          nom: classData.nom,
          niveauId: classData.niveauId,
          anneeScolaireId: classData.anneeScolaireId,
          capacite_max: classData.capacite_max,
        },
      });
    });
  }

  async updateClass(classId, updateData) {
    return prisma.$transaction(async (tx) => {
      const existingClass = await tx.class.findUnique({
        where: { id: classId },
      });
      if (!existingClass) throw new Error("Classe non trouvée");

      if (updateData.nom && updateData.nom !== existingClass.nom) {
        const nameConflict = await tx.class.findFirst({
          where: {
            nom: updateData.nom,
            anneeScolaireId:
              updateData.anneeScolaireId || existingClass.anneeScolaireId,
            NOT: { id: classId },
          },
        });
        if (nameConflict)
          throw new Error("Ce nom de classe est déjà utilisé pour cette année");
      }

      return tx.class.update({
        where: { id: classId },
        data: updateData,
      });
    });
  }

  async setClassStatus(classId, action) {
    const validTransitions = {
      delete: { from: "actif", to: "inactif" },
      restore: { from: "inactif", to: "actif" },
    };

    if (!validTransitions[action]) throw new Error("Action invalide");

    const { from, to } = validTransitions[action];
    return prisma.$transaction(async (tx) => {
      const classe = await tx.class.findUnique({ where: { id: classId } });
      if (!classe) throw new Error("Classe non trouvée");
      if (classe.statut !== from)
        throw new Error(`La classe est déjà ${classe.statut}`);

      return tx.class.update({
        where: { id: classId },
        data: { statut: to },
      });
    });
  }

  async getClassById(classId) {
    return prisma.class.findUnique({
      where: { id: classId },
      include: {
        niveau: true,
        anneeScolaire: true,
        students: {
          select: {
            id: true,
            user: { select: { nom: true, prenom: true, email: true } },
          },
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: { select: { nom: true, prenom: true } },
              },
            },
          },
        },
      },
    });
  }

  async getClassesByTeacher(teacherId) {
    if (!teacherId) throw new Error("ID du professeur requis");
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId }, // ici on cherche par userId
    });
    if (!teacher) throw new Error("cette professeur est introuvable");

    const classes = await prisma.class.findMany({
      where: {
        classSubjects: {
          some: {
            teacherId: teacher.id,
          },
        },
        statut: "actif",
      },
      include: {
        niveau: { select: { id: true, libelle: true } },
        anneeScolaire: { select: { id: true, libelle: true } },
        _count: { select: { students: true } },
      },
      orderBy: { nom: "asc" },
      distinct: ["id"],
    });

    return classes;
  }

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      prisma.class.count(),
      prisma.class.count({ where: { statut: "actif" } }),
      prisma.class.count({ where: { statut: "inactif" } }),
    ]);

    return { total, active, inactive };
  }

  async getClassWithStudents(classId) {
    const classe = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        niveau: true,
        anneeScolaire: true,
        students: {
          where: {
            user: {
              statut: "actif",
            },
          },
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                statut: true,
              },
            },
          },
          orderBy: {
            user: {
              nom: "asc",
            },
          },
        },
      },
    });
    return classe;
  }

  async getStudentsByClass(classId) {
      const students = await prisma.student.findMany({
        where: {
          classId: classId,
          user: {
            statut: "actif",
          },
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              telephone: true,
            },
          },
        },
        orderBy: {
          user: {
            nom: "asc",
            prenom: "asc",
          },
        },
      });
      return students
  }
}
