import { th } from "zod/v4/locales";
import { prisma } from "../config/database.js";

export default class GradeService {
  async createGrade(gradeData, currentTeacherId) {
    const teacher = await this.getCurrentTeacher(currentTeacherId);
    return prisma.$transaction(
      async (tx) => {
        await this._verifyTeachingRights(tx, {
          teacherId: teacher.id,
          subjectId: gradeData.subjectId,
          studentId: gradeData.studentId,
          anneeScolaireId: gradeData.anneeScolaireId,
        });

        const grade = await tx.grade.create({
          data: {
            ...gradeData,
            teacherId: teacher.id,
          },
          include: this._defaultIncludes(),
        });

        await this._markGradeUpdated(tx, grade);

        return grade;
      },
      { timeout: 10000 }
    );
  }
  async updateGrade(id, updateData, currentTeacherId) {
    const teacher = await this.getCurrentTeacherId(currentTeacherId);
    return prisma.$transaction(async (tx) => {
      const grade = await tx.grade.findUnique({ where: { id } });
      if (!grade) throw new Error("Note introuvable");
      if (grade.teacherId !== currentTeacherId) {
        throw new Error("Vous n'êtes pas l'auteur de cette note");
      }

      const updatedGrade = await tx.grade.update({
        where: { id },
        data: updateData,
        include: this._defaultIncludes(),
      });

      await this._markGradeUpdated(tx, updatedGrade); // <-- ajout du tracking

      return updatedGrade;
    });
  }

  async getCurrentTeacher(currentUserId) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: currentUserId },
    });
    if (!teacher) throw new Error("Professeur introuvable");
    return teacher;
  }

  async getGradesByStudent(studentId, filters = {}, currentTeacherId = null) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new Error("Élève introuvable");

    const where = {
      studentId,
      ...this._buildFilters(filters),
      ...(currentTeacherId && { teacherId: currentTeacherId }),
    };

    return prisma.grade.findMany({
      where,
      include: this._defaultIncludes(),
      orderBy: { date: "desc" },
    });
  }

  async getGradesByClass(classId, filters = {}, currentTeacherId = null) {
    const idTeacher = await this.getCurrentTeacherId(currentTeacherId);
    const where = {
      student: {
        classId: classId,
      },
      ...this._buildFilters(filters),
      ...(currentTeacherId && { teacherId: currentTeacherId }), // Filtre par prof si fourni
    };

    return prisma.grade.findMany({
      where,
      include: {
        ...this._defaultIncludes(),
        student: { include: { user: true } },
      },
    });
  }

  async deleteGrade(id, currentTeacherId) {
    const teacher = await this.getCurrentTeacher(currentTeacherId);
    return prisma.$transaction(async (tx) => {
      const grade = await tx.grade.findUnique({ where: { id } });
      if (!grade) throw new Error("Note introuvable");
      if (grade.teacherId !== teacher.id) {
        throw new Error("Vous n'êtes pas l'auteur de cette note");
      }

      return tx.grade.delete({ where: { id } });
    });
  }

    async getCurrentTeacherId(userId){
      const teacher = await prisma.teacher.findUnique({
        where: {userId: userId}
      });
      if(!teacher) throw new Error("professeur introuvable");
      return teacher.id;
    }

  async _markGradeUpdated(tx, grade) {
    // Vérifie si une entrée existe déjà
    const existing = await tx.gradeUpdateTrack.findFirst({
      where: {
        gradeId: grade.id,
        studentId: grade.studentId,
        subjectId: grade.subjectId,
        trimestreId: grade.trimestreId,
      },
    });

    if (!existing) {
      await tx.gradeUpdateTrack.create({
        data: {
          gradeId: grade.id,
          studentId: grade.studentId,
          subjectId: grade.subjectId,
          trimestreId: grade.trimestreId,
        },
      });
    }
  }

  async _verifyTeachingRights(
    prismaClient,
    { teacherId, subjectId, studentId, anneeScolaireId }
  ) {
    const student = await prismaClient.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student) throw new Error("Élève introuvable");
    console.log(
      "Vérification des droits d'enseignement pour le professeur:",
      teacherId,
      "et la matière:",
      subjectId
    );
    const [teacherSubject, classSubject] = await Promise.all([
      prismaClient.teacherSubject.findFirst({
        where: { teacherId, subjectId },
      }),
      prismaClient.classSubject.findFirst({
        where: {
          classId: student.classId,
          subjectId,
          anneeScolaireId,
          teacherId,
        },
      }),
    ]);

    if (!teacherSubject) throw new Error("Vous n'enseignez pas cette matière");
    if (!classSubject)
      throw new Error(
        "Cette matière n'est pas enseignée dans la classe de l'élève"
      );
  }

  _buildFilters(filters) {
    const where = {};
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.trimestreId) where.trimestreId = filters.trimestreId;
    if (filters.type_note) where.type_note = filters.type_note;
    if (filters.anneeScolaireId)
      where.anneeScolaireId = filters.anneeScolaireId;
    return where;
  }

  _defaultIncludes() {
    return {
      subject: true,
      trimestre: true,
      teacher: { include: { user: true } },
      annee_scolaire: true,
    };
  }
}