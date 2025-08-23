import { prisma } from "../config/database.js";

export default class TeacherSubjectService {
  async assignSubjectToTeacher(data) {
    return prisma.$transaction(async (tx) => {
      const [teacher, subject, existing] = await Promise.all([
        tx.teacher.findUnique({
          where: { id: data.teacherId },
          include: { user: true },
        }),
        tx.subject.findUnique({ where: { id: data.subjectId } }),
        tx.teacherSubject.findUnique({
          where: {
            teacherId_subjectId: {
              teacherId: data.teacherId,
              subjectId: data.subjectId,
            },
          },
        }),
      ]);

      if (!teacher) throw new Error("Professeur introuvable");
      if (!subject) throw new Error("Matière introuvable");
      if (existing)
        throw new Error("Ce professeur enseigne déjà cette matière");

      return tx.teacherSubject.create({
        data: {
          teacherId: data.teacherId,
          subjectId: data.subjectId,
        },
        include: {
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
          subject: true,
        },
      });
    });
  }

  async getAssociation(id) {
    const association = await prisma.teacherSubject.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        subject: true,
      },
    });

    if (!association) {
      throw new Error("Association introuvable");
    }

    return association;
  }

  async getTeacherSubjects(teacherId) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId },
    });
    if (!teacher) throw new Error("Professeur introuvable");
    const id = teacher.id
    return prisma.teacherSubject.findMany({
      where: { id },
      include: { subject: true },
    });
  }

  async removeAssignment(id) {
    return prisma.teacherSubject.delete({
      where: {
        id,
      },
    });
  }

  async getAllAssociations() {
    return prisma.teacherSubject.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        subject: true,
      },
      orderBy: {
        teacher: {
          user: {
            nom: "asc",
          },
        },
      },
    });
  }
}
