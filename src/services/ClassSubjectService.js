import { prisma } from "../config/database.js";

export default class ClassSubjectService {
  async assignSubjectToClass(data) {
    return prisma.$transaction(async (tx) => {
      const [classe, subject, annee, teacher] = await Promise.all([
        tx.class.findUnique({ where: { id: data.classId } }),
        tx.subject.findUnique({ where: { id: data.subjectId } }),
        tx.anneeScolaire.findUnique({ where: { id: data.anneeScolaireId } }),
        data.teacherId
          ? tx.teacher.findUnique({ where: { id: data.teacherId } })
          : null,
      ]);

      if (!classe) throw new Error("Classe introuvable");
      if (!subject) throw new Error("Matière introuvable");
      if (!annee) throw new Error("Année scolaire introuvable");

      if (data.teacherId) {
        if (!teacher) throw new Error("Professeur introuvable");
        await this._checkTeacherQualification(
          tx,
          data.teacherId,
          data.subjectId
        );
      }

      const existing = await tx.classSubject.findFirst({
        where: {
          classId: data.classId,
          subjectId: data.subjectId,
          anneeScolaireId: data.anneeScolaireId,
        },
      });
      if (existing)
        throw new Error("Cette matière est déjà assignée à cette classe");

      return tx.classSubject.create({
        data,
        include: {
          class: { select: { nom: true } },
          subject: true,
          teacher: {
            include: { user: { select: { nom: true, prenom: true } } },
          },
        },
      });
    });
  }

  async _checkTeacherQualification(tx, teacherId, subjectId) {
    const canTeach = await tx.teacherSubject.findFirst({
      where: { teacherId, subjectId },
    });
    if (!canTeach)
      throw new Error("Ce professeur n'est pas qualifié pour cette matière");
  }

  async updateAssignment(id, updateData) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.classSubject.findUnique({
        where: { id },
        include: { subject: true },
      });
      if (!assignment) throw new Error("Assignation introuvable");

      if (updateData.teacherId) {
        const canTeach = await tx.teacherSubject.findFirst({
          where: {
            teacherId: updateData.teacherId,
            subjectId: assignment.subjectId,
          },
        });
        if (!canTeach) throw new Error("Ce professeur n'est pas qualifié");
      }

      return tx.classSubject.update({
        where: { id },
        data: updateData,
        include: {
          subject: true,
          teacher: { include: { user: true } },
        },
      });
    });
  }

  async getClassSubjects(classId, anneeScolaireId) {
    const classe = await prisma.class.findUnique({ where: { id: classId } });
    if (!classe) throw new Error("Classe introuvable");
    const annee = await prisma.anneeScolaire.findUnique({
      where: { id: anneeScolaireId },
    });
    if (!annee) throw new Error("Année scolaire introuvable");
    return prisma.classSubject.findMany({
      where: { classId, anneeScolaireId },
      include: {
        subject: true,
        teacher: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    });
  }

  async getAllClassSubjects(anneeScolaireId) {
    const annee = await prisma.anneeScolaire.findUnique({
      where: { id: anneeScolaireId },
    });
    if (!annee) throw new Error("Année scolaire introuvable");
    return prisma.classSubject.findMany({
      where: { anneeScolaireId },
      include: {
        subject: true,
        teacher: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    });
  }

  async removeAssignment(id) {
    const assignment = await prisma.classSubject.findUnique({ where: { id } });
    if (!assignment) throw new Error("Assignation introuvable");
    return prisma.classSubject.delete({ where: { id } });
  }
}