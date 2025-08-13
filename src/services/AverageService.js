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
    return prisma.$transaction(
      async (tx) => {
        await this._verifyRelations(tx, data);

        // Calcul automatique du rang si non fourni
        if (data.rang === undefined) {
          data.rang = await this._calculateRank(tx, data);
        }

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
      },
      { timeout: 10000 }
    );
  }

  /**
   * Récupère les moyennes d'un élève
   * @param {number} studentId ID de l'élève
   * @param {object} filters Filtres optionnels
   * @returns {Promise<object[]>} Liste des moyennes
   */
  async getAveragesByStudent(studentId, filters = {}) {
    return prisma.average.findMany({
      where: { studentId, ...this._buildFilters(filters) },
      include: this._defaultIncludes(),
      orderBy: { subject: { nom: "asc" } },
    });
  }

  /**
   * Récupère les moyennes d'une classe
   * @param {number} classId ID de la classe
   * @param {object} filters Filtres optionnels
   * @param {number|null} teacherId ID du professeur (pour filtrage)
   * @returns {Promise<object[]>} Liste des moyennes
   */
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

  /**
   * Calcule toutes les moyennes d'une classe
   * @param {number} classId ID de la classe
   * @param {number} trimestreId ID du trimestre
   * @param {boolean} includeEmpty Inclure les moyennes nulles
   * @returns {Promise<object>} Résultat du calcul
   */
  async calculateClassAverages(classId, trimestreId, includeEmpty = false) {
    console.log(`Calcul des moyennes pour la classe ${classId}, trimestre ${trimestreId}`); // Debugging
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

  /**
   * Calcule les moyennes uniquement pour les élèves modifiés
   * @param {number} classId ID de la classe
   * @param {number} trimestreId ID du trimestre
   * @param {boolean} includeEmpty Inclure les moyennes nulles
   * @returns {Promise<object>} Résultat du calcul
   */
  async calculateUpdatedAverages(classId, trimestreId, includeEmpty = false) {
    console.log(`Calcul des moyennes mises à jour pour la classe ${classId}, trimestre ${trimestreId}`); // Debugging
    return prisma.$transaction(
      async (tx) => {
        const startTime = Date.now();
        const updatedStudentIds = await this._getUpdatedStudentIds(
          tx,
          trimestreId
        );

        console.log(updatedStudentIds)

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

  /**
   * Calcule les moyennes pour une classe/trimestre
   * @private
   */
  async _computeAverages(
    tx,
    classId,
    trimestreId,
    studentIds = [],
    includeEmpty = false
  ) {
    // 1. Récupération des données de base
    const [students, subjects, allGrades, trimestre] = await Promise.all([
      studentIds.length > 0
        ? tx.student.findMany({
            where: { id: { in: studentIds }, classId },
            select: { id: true },
          })
        : tx.student.findMany({ where: { classId }, select: { id: true } }),
      tx.subject.findMany({
        where: { classSubjects: { some: { classId } } },
        select: { id: true, coefficient: true }, // On récupère le coefficient ici
      }),
      tx.grade.findMany({
        where: {
          student: { classId },
          trimestreId,
          ...(studentIds.length > 0 && { studentId: { in: studentIds } }),
        },
        select: {
          studentId: true,
          subjectId: true,
          note: true,
          // On ne demande plus coefficient ici
        },
      }),
      tx.trimestre.findUnique({
        where: { id: trimestreId },
        select: { anneeScolaireId: true },
      }),
    ]);

    console.log(`Calcul des moyennes pour la classe ${classId}, trimestre ${trimestreId}`); // Debugging

    const averages = [];
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // 2. Calcul par matière
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

        console.log(moyenne, totalCoeff, sum, coef); // Debug

        if (moyenne !== null) {
          subjectAverages.push({ studentId: student.id, moyenne });
        }
      }
      console.log(`Moyenne pour la matière ${subject.id}:`, subjectAverages); 

      subjectAverages.sort((a, b) => b.moyenne - a.moyenne)
      subjectAverages.forEach((avg, index) => {
        console.log(`Moyenne pour l'élève ${avg.studentId} en matière ${subject.id}: ${avg.moyenne}`);
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

  /**
   * Remplace les anciennes moyennes par les nouvelles
   * @private
   */
  async _replaceAverages(tx, averages) {
    // Group by student and subject for efficient deletion
    const studentIds = [...new Set(averages.map((a) => a.studentId))];
    const subjectIds = [...new Set(averages.map((a) => a.subjectId))];
    const trimestreId = averages[0]?.trimestreId;

    await tx.average.deleteMany({
      where: {
        trimestreId,
        studentId: { in: studentIds },
        subjectId: { in: subjectIds },
      },
    });

    return tx.average.createMany({
      data: averages,
      skipDuplicates: true,
    });
  }

  /**
   * Récupère les IDs des élèves avec notes modifiées
   * @private
   */
  async _getUpdatedStudentIds(tx, trimestreId) {
    const updates = await tx.gradeUpdateTrack.findMany({
      where: { trimestreId },
      select: { studentId: true },
      distinct: ["studentId"],
    });
    return updates.map((u) => u.studentId);
  }

  /**
   * Nettoie le tracking des modifications
   * @private
   */
  async _clearUpdateTracking(tx, studentIds, trimestreId) {
    return tx.gradeUpdateTrack.deleteMany({
      where: { studentId: { in: studentIds }, trimestreId },
    });
  }

  /**
   * Construit le résultat du calcul
   * @private
   */
  _buildResult(averages, duration, type, studentCount = null) {
    const result = {
      count: averages.length,
      duration: `${duration}ms`,
      message: `${averages.length} moyennes recalculées en ${duration}ms`,
      strategy: type,
      affectedSubjects: [...new Set(averages.map((a) => a.subjectId))].length,
    };

    if (type === "incremental") {
      result.updatedStudents = studentCount;
    }

    return result;
  }

  /**
   * Vérifie les relations avant création/mise à jour
   * @private
   */
  async _verifyRelations(prismaClient, data) {
    const [student, subject, trimestre, annee] = await Promise.all([
      prismaClient.student.findUnique({ where: { id: data.studentId } }),
      prismaClient.subject.findUnique({ where: { id: data.subjectId } }),
      prismaClient.trimestre.findUnique({ where: { id: data.trimestreId } }),
      prismaClient.anneeScolaire.findUnique({
        where: { id: data.anneeScolaireId },
      }),
    ]);

    if (!student) throw new Error("Élève introuvable");
    if (!subject) throw new Error("Matière introuvable");
    if (!trimestre) throw new Error("Trimestre introuvable");
    if (!annee) throw new Error("Année scolaire introuvable");
  }

  /**
   * Calcule le rang d'un élève pour une matière/trimestre
   * @private
   */
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

  /**
   * Construit les filtres de requête
   * @private
   */
  _buildFilters(filters) {
    const where = {};
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.trimestreId) where.trimestreId = filters.trimestreId;
    if (filters.anneeScolaireId)
      where.anneeScolaireId = filters.anneeScolaireId;
    return where;
  }

  /**
   * Retourne les relations par défaut à inclure
   * @private
   */
  _defaultIncludes() {
    return {
      subject: true,
      trimestre: { include: { annee_scolaire: true } },
      student: { include: { user: { select: { nom: true, prenom: true } } } },
    };
  }
}
