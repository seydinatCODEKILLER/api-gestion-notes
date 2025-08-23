// src/services/average.service.js
import { log } from "console";
import { prisma } from "../config/database.js";

export default class AverageService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Crée ou met à jour une moyenne
   * @param {object} data Données de la moyenne
   * @returns {Promise<object>} La moyenne créée/mise à jour
   */
  async createOrUpdateAverage(data) {
    return prisma.$transaction(async (tx) => {
      // Vérifie que les relations existent
      await this._verifyRelations(tx, data);

      // Récupérer toutes les notes pour cet élève/matière/trimestre avec le coefficient depuis la matière
      const grades = await tx.grade.findMany({
        where: {
          studentId: data.studentId,
          subjectId: data.subjectId,
          trimestreId: data.trimestreId,
        },
        select: {
          note: true,
          subject: {
            select: { coefficient: true }, // prend le coefficient depuis la matière
          },
        },
      });

      if (!grades.length) {
        data.moyenne = 0; // ou null si tu préfères
      } else {
        // Calcul de la moyenne pondérée
        const totalWeighted = grades.reduce(
          (acc, g) => acc + Number(g.note) * Number(g.subject.coefficient),
          0
        );
        const totalCoef = grades.reduce(
          (acc, g) => acc + Number(g.subject.coefficient),
          0
        );
        data.moyenne =
          totalCoef > 0
            ? parseFloat((totalWeighted / totalCoef).toFixed(2))
            : 0;
      }

      // Calcul automatique du rang si non fourni
      if (data.rang === undefined) {
        data.rang = await this._calculateRank(tx, data);
      }

      // Upsert avec clé unique composite
      return tx.average.upsert({
        where: {
          studentId_subjectId_trimestreId: {
            studentId: data.studentId,
            subjectId: data.subjectId,
            trimestreId: data.trimestreId,
          },
        },
        create: data,
        update: data,
        include: this._defaultIncludes(),
      });
    });
  }

  async getAveragesByStudent(studentId, filters = {}) {
    return prisma.average.findMany({
      where: { studentId, ...this._buildFilters(filters) },
      include: this._defaultIncludes(),
      orderBy: { subject: { nom: "asc" } },
    });
  }

  async getAveragesByClass(classId, filters = {}, teacherId = null) {
    const where = {
      student: { classId },
      ...this._buildFilters(filters),
    };

    if (teacherId) {
      where.subject = {
        teacherSubjects: {
          some: { teacherId },
        },
      };
    }

    return prisma.average.findMany({
      where,
      include: {
        ...this._defaultIncludes(),
        student: { include: { user: true } },
      },
      orderBy: [{ subject: { nom: "asc" } }, { rang: "asc" }],
    });
  }

  async calculateClassAverages(classId, trimestreId, includeEmpty = false) {
    console.log(
      `Calcul des moyennes pour la classe ${classId}, trimestre ${trimestreId}`
    );
    return prisma.$transaction(
      async (tx) => {
        const startTime = Date.now();
        const averages = await this._computeAverages(
          tx,
          classId,
          trimestreId,
          [],
          includeEmpty
        );

        if (averages.length > 0) {
          await this._replaceAverages(tx, averages);
        }

        const duration = Date.now() - startTime;
        return this._buildResult(averages, duration, "full");
      },
      { timeout: 30000 }
    );
  }

  async calculateUpdatedAverages(classId, trimestreId, includeEmpty = false) {
    console.log(
      `Calcul des moyennes mises à jour pour la classe ${classId}, trimestre ${trimestreId}`
    );
    return prisma.$transaction(
      async (tx) => {
        const startTime = Date.now();
        const updatedStudentIds = await this._getUpdatedStudentIds(
          tx,
          trimestreId
        );

        if (updatedStudentIds.length === 0) {
          return {
            success: true,
            message: "Aucun élève modifié trouvé",
            data: [],
          };
        }

        const averages = await this._computeAverages(
          tx,
          classId,
          trimestreId,
          updatedStudentIds,
          includeEmpty
        );

        if (averages.length > 0) {
          await this._replaceAverages(tx, averages);
          await this._clearUpdateTracking(tx, updatedStudentIds, trimestreId);
        }

        const duration = Date.now() - startTime;
        return this._buildResult(
          averages,
          duration,
          "incremental",
          updatedStudentIds.length
        );
      },
      { timeout: 30000 }
    );
  }

  async _computeAverages(
    tx,
    classId,
    trimestreId,
    studentIds = [],
    includeEmpty = false
  ) {
    const [students, subjects, allGrades, trimestre] = await Promise.all([
      studentIds.length > 0
        ? tx.student.findMany({
            where: { id: { in: studentIds }, classId },
            select: { id: true },
          })
        : tx.student.findMany({ where: { classId }, select: { id: true } }),
      tx.subject.findMany({
        where: { classSubjects: { some: { classId } } },
        select: { id: true, coefficient: true },
      }),
      tx.grade.findMany({
        where: {
          student: { classId },
          trimestreId,
          ...(studentIds.length > 0 && { studentId: { in: studentIds } }),
        },
        select: { studentId: true, subjectId: true, note: true },
      }),
      tx.trimestre.findUnique({
        where: { id: trimestreId },
        select: { anneeScolaireId: true },
      }),
    ]);

    if (!trimestre) throw new Error(`Trimestre ${trimestreId} introuvable`);
    if (!trimestre.anneeScolaireId)
      throw new Error(`Trimestre ${trimestreId} sans anneeScolaireId`);

    const averages = [];

    for (const subject of subjects) {
      const subjectAverages = [];
      const coef = Number(subject.coefficient);

      for (const student of students) {
        const grades = allGrades.filter(
          (g) => g.studentId === student.id && g.subjectId === subject.id
        );

        if (grades.length === 0 && !includeEmpty) continue;

        const { sum, totalCoeff } = grades.reduce(
          (acc, grade) => ({
            sum: acc.sum + Number(grade.note) * coef,
            totalCoeff: acc.totalCoeff + coef,
          }),
          { sum: 0, totalCoeff: 0 }
        );

        const moyenne =
          totalCoeff > 0
            ? parseFloat((sum / totalCoeff).toFixed(2))
            : includeEmpty
            ? 0
            : null;

        if (moyenne !== null)
          subjectAverages.push({ studentId: student.id, moyenne });
      }

      subjectAverages.sort((a, b) => b.moyenne - a.moyenne);
      subjectAverages.forEach((avg, index) => {
        averages.push({
          studentId: avg.studentId,
          subjectId: subject.id,
          trimestreId,
          moyenne: avg.moyenne,
          rang: index + 1,
          anneeScolaireId: trimestre.anneeScolaireId,
        });
      });
    }

    return averages;
  }

  // === VERSION CORRIGÉE DE _replaceAverages ===
  async _replaceAverages(tx, averages) {
    for (const avg of averages) {
      if (avg.moyenne === null || avg.moyenne === undefined) continue;

      await tx.average.upsert({
        where: {
          studentId_subjectId_trimestreId: {
            studentId: avg.studentId,
            subjectId: avg.subjectId,
            trimestreId: avg.trimestreId,
          },
        },
        create: avg,
        update: avg,
        include: this._defaultIncludes(),
      });
    }
  }

  async _getUpdatedStudentIds(tx, trimestreId) {
    const updates = await tx.gradeUpdateTrack.findMany({
      where: { trimestreId },
      select: { studentId: true },
      distinct: ["studentId"],
    });
    return updates.map((u) => u.studentId);
  }

  async _clearUpdateTracking(tx, studentIds, trimestreId) {
    return tx.gradeUpdateTrack.deleteMany({
      where: { studentId: { in: studentIds }, trimestreId },
    });
  }

  _buildResult(averages, duration, type, studentCount = null) {
    const result = {
      count: averages.length,
      duration: `${duration}ms`,
      message: `${averages.length} moyennes recalculées en ${duration}ms`,
      strategy: type,
      affectedSubjects: [...new Set(averages.map((a) => a.subjectId))].length,
    };
    if (type === "incremental") result.updatedStudents = studentCount;
    return result;
  }

  async _verifyRelations(prismaClient, data) {
    const [student, subject, trimestre] = await Promise.all([
      prismaClient.student.findUnique({ where: { id: data.studentId } }),
      prismaClient.subject.findUnique({ where: { id: data.subjectId } }),
      prismaClient.trimestre.findUnique({ where: { id: data.trimestreId } }),
    ]);

    if (!student) throw new Error("Élève introuvable");
    if (!subject) throw new Error("Matière introuvable");
    if (!trimestre) throw new Error("Trimestre introuvable");

    const anneeScolaireId = trimestre.anneeScolaireId;
    if (!anneeScolaireId) throw new Error("Trimestre sans anneeScolaireId");

    data.anneeScolaireId = anneeScolaireId;
  }

  async _calculateRank(prismaClient, data) {
    const averages = await prismaClient.average.findMany({
      where: {
        subjectId: data.subjectId,
        trimestreId: data.trimestreId,
        anneeScolaireId: data.anneeScolaireId,
      },
      orderBy: { moyenne: "desc" },
      select: { studentId: true, moyenne: true },
    });

    return averages.findIndex((avg) => avg.studentId === data.studentId) + 1;
  }

  _buildFilters(filters) {
    const where = {};
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.trimestreId) where.trimestreId = filters.trimestreId;
    if (filters.anneeScolaireId)
      where.anneeScolaireId = filters.anneeScolaireId;
    return where;
  }

  _defaultIncludes() {
    return {
      subject: true,
      trimestre: { include: { annee_scolaire: true } },
      student: { include: { user: { select: { nom: true, prenom: true } } } },
    };
  }
}
