import { prisma } from "../config/database.js";

export default class EvaluationService {
  async getAllEvaluations(options = {}) {
    const {
      classId,
      subjectId,
      teacherId,
      anneeScolaireId,
      trimestreId,
      page = 1,
      pageSize = 10,
    } = options;

    return prisma.evaluation.findMany({
      where: {
        classId,
        subjectId,
        teacherId,
        anneeScolaireId,
        trimestreId,
      },
      include: {
        class: { select: { id: true, nom: true } },
        subject: { select: { id: true, nom: true } },
        teacher: {
          include: {
            user: { select: { nom: true, prenom: true } },
          },
        },
        annee_scolaire: { select: { id: true, libelle: true } },
        trimestre: { select: { id: true, libelle: true } },
        _count: { select: { notes: true } },
      },
      orderBy: { date_evaluation: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countEvaluations(filters = {}) {
    return prisma.evaluation.count({
      where: filters,
    });
  }

  async getCurrentTeacher(userId){
    const teacher = await prisma.teacher.findUnique({
      where: {userId: userId}
    });
    if(!teacher) throw new Error("professeur introuvable");
    return teacher.id;
  }

  async createEvaluation(evaluationData) {
    const id = await this.getCurrentTeacher(evaluationData.teacherId);
    return prisma.$transaction(async (tx) => {
      // Vérifier si l'enseignant enseigne cette matière dans cette classe
      const classSubject = await tx.classSubject.findFirst({
        where: {
          classId: evaluationData.classId,
          subjectId: evaluationData.subjectId,
          teacherId: id,
        },
      });

      if (!classSubject) {
        throw new Error(
          "Cet enseignant n'enseigne pas cette matière dans cette classe"
        );
      }

      return tx.evaluation.create({
        data: {
          classId: evaluationData.classId,
          subjectId: evaluationData.subjectId,
          teacherId: id,
          type: evaluationData.type,
          titre: evaluationData.titre,
          date_evaluation: new Date(evaluationData.date_evaluation),
          anneeScolaireId: evaluationData.anneeScolaireId,
          trimestreId: evaluationData.trimestreId,
          coefficient: evaluationData.coefficient,
          description: evaluationData.description,
        },
        include: {
          class: true,
          subject: true,
          teacher: { include: { user: true } },
        },
      });
    });
  }

  async updateEvaluation(evaluationId, updateData) {
    return prisma.$transaction(async (tx) => {
      const existingEvaluation = await tx.evaluation.findUnique({
        where: { id: evaluationId },
      });

      if (!existingEvaluation) throw new Error("Évaluation non trouvée");

      // Vérifier s'il y a des notes déjà saisies
      if (existingEvaluation.date_evaluation < new Date()) {
        const hasNotes = await tx.grade.count({
          where: { evaluationId },
        });

        if (hasNotes > 0) {
          throw new Error("Impossible de modifier une évaluation déjà notée");
        }
      }

      return tx.evaluation.update({
        where: { id: evaluationId },
        data: {
          ...updateData,
          date_evaluation: updateData.date_evaluation
            ? new Date(updateData.date_evaluation)
            : undefined,
        },
        include: {
          class: true,
          subject: true,
          teacher: { include: { user: true } },
        },
      });
    });
  }

  async deleteEvaluation(evaluationId) {
    return prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.findUnique({
        where: { id: evaluationId },
        include: { _count: { select: { notes: true } } },
      });

      if (!evaluation) throw new Error("Évaluation non trouvée");

      if (evaluation._count.notes > 0) {
        throw new Error("Impossible de supprimer une évaluation déjà notée");
      }

      return tx.evaluation.delete({
        where: { id: evaluationId },
      });
    });
  }

  async getEvaluationById(evaluationId) {
    return prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        class: { include: { niveau: true } },
        subject: true,
        teacher: {
          include: {
            user: { select: { nom: true, prenom: true, email: true } },
          },
        },
        annee_scolaire: true,
        trimestre: true,
        notes: {
          include: {
            student: {
              include: {
                user: { select: { nom: true, prenom: true } },
              },
            },
          },
        },
      },
    });
  }

  async getEvaluationsByClass(classId, filters = {}) {
    return prisma.evaluation.findMany({
      where: {
        classId,
        subjectId: filters.subjectId,
        trimestreId: filters.trimestreId,
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { nom: true, prenom: true } },
          },
        },
        trimestre: true,
        _count: { select: { notes: true } },
      },
      orderBy: { date_evaluation: "desc" },
    });
  }

  async getEvaluationsByTeacher(teacherId, filters = {}) {
    const idTeacher = await this.getCurrentTeacher(teacherId);
    return prisma.evaluation.findMany({
      where: {
        teacherId: idTeacher,
        // classId: filters.classId,
        // subjectId: filters.subjectId,
        // trimestreId: filters.trimestreId,
      },
      include: {
        class: true,
        subject: true,
        trimestre: true,
        _count: { select: { notes: true } },
      },
      orderBy: { date_evaluation: "desc" },
    });
  }

  async getEvaluationStats(evaluationId) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        notes: {
          include: {
            student: {
              include: {
                user: { select: { nom: true, prenom: true } },
              },
            },
          },
        },
        class: {
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    });

    if (!evaluation) throw new Error("Évaluation non trouvée");

    const totalStudents = evaluation.class._count.students;
    const gradedStudents = evaluation.notes.length;
    const notGradedStudents = totalStudents - gradedStudents;

    const grades = evaluation.notes.map((note) => note.note);
    const average =
      grades.length > 0
        ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length
        : 0;

    const maxGrade = grades.length > 0 ? Math.max(...grades) : 0;
    const minGrade = grades.length > 0 ? Math.min(...grades) : 0;

    return {
      totalStudents,
      gradedStudents,
      notGradedStudents,
      average: parseFloat(average.toFixed(2)),
      maxGrade,
      minGrade,
      completionRate: parseFloat(
        ((gradedStudents / totalStudents) * 100).toFixed(2)
      ),
    };
  }
}
