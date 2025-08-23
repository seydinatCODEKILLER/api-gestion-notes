// src/services/ReportCardService.js
import PDFHelper from "../utils/pdf.js";
import { prisma } from "../config/database.js";
import PDFService from "./PDFService.js";
import fs from "fs/promises";

export default class ReportCardService {
  constructor() {
    this.pdfService = new PDFService();
    this.pdfHelper = new PDFHelper();
  }

  async generateReportCard(data) {
    return prisma.$transaction(async (tx) => {
      await this._verifyRelations(tx, data);

      const existing = await tx.reportCard.findUnique({
        where: {
          studentId_trimestreId: {
            studentId: data.studentId,
            trimestreId: data.trimestreId,
          },
        },
      });

      if (existing) {
        throw new Error(
          "Un bulletin existe déjà pour cet élève et ce trimestre"
        );
      }

      // Vérifier qu'il y a des évaluations
      const student = await tx.student.findUnique({
        where: { id: data.studentId },
      });
      const evaluations = await tx.evaluation.findMany({
        where: { classId: student.classId, trimestreId: data.trimestreId },
      });
      if (!evaluations.length)
        throw new Error("Pas d'évaluations pour ce trimestre");

      // Récupérer les moyennes avec les matières
      const averages = await tx.average.findMany({
        where: {
          studentId: data.studentId,
          trimestreId: data.trimestreId,
        },
        include: {
          subject: true,
        },
      });

      // Récupérer les notes avec l'évaluation
      const grades = await tx.grade.findMany({
        where: {
          studentId: data.studentId,
          evaluation: { trimestreId: data.trimestreId },
        },
        select: {
          subjectId: true,
          note: true,
          evaluation: {
            select: { titre: true, type: true, date_evaluation: true },
          },
          subject: { select: { coefficient: true } },
        },
      });

      // Organiser les notes par matière
      const gradesBySubject = grades.reduce((acc, grade) => {
        if (!acc[grade.subjectId]) acc[grade.subjectId] = [];
        acc[grade.subjectId].push(grade);
        return acc;
      }, {});

      // Fusionner les données pour le PDF
      const averagesWithDetails = averages.map((avg) => {
        const subjectGrades = gradesBySubject[avg.subjectId] || [];

        const devoirs = subjectGrades
          .filter((g) => g.evaluation.type === "devoir")
          .map((g) => g.note);

        const composition =
          subjectGrades.find((g) => g.evaluation.type === "composition")
            ?.note || null;

        return {
          ...avg,
          devoir1: devoirs[0] || null,
          devoir2: devoirs[1] || null,
          composition,
          coefficient: avg.subject.coefficient,
        };
      });

      // Calcul de la moyenne générale
      let totalPoints = 0;
      let totalCoef = 0;
      averagesWithDetails.forEach((avg) => {
        if (avg.moyenne !== null && avg.coefficient) {
          totalPoints += avg.moyenne * avg.coefficient;
          totalCoef += avg.coefficient;
        }
      });
      const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : 0;
      const appreciationGenerale =
        this.pdfHelper.getAppreciation(moyenneGenerale);

      const rangClasse = await this.calculateStudentRank(
        tx,
        data.studentId,
        data.trimestreId
      );

      // Génération du PDF
      const pdfResult = await this.pdfService.generateAndSaveReportCardPDF({
        ...data,
        moyenne_generale: moyenneGenerale,
        appreciation_generale: appreciationGenerale,
        rang_classe: rangClasse,
        averages: averagesWithDetails,
        student: await tx.student.findUnique({
          where: { id: data.studentId },
          include: { user: true, class: true },
        }),
        trimestre: await tx.trimestre.findUnique({
          where: { id: data.trimestreId },
          include: { annee_scolaire: true },
        }),
      });

      return tx.reportCard.create({
        data: {
          ...data,
          moyenne_generale: moyenneGenerale,
          appreciation_generale: appreciationGenerale,
          rang_classe: rangClasse,
          chemin_fichier: pdfResult.publicUrl,
          file_path: pdfResult.filePath,
          anneeScolaireId: await this._getAnneeScolaireId(tx, data.trimestreId),
        },
        include: this._defaultIncludes(),
      });
    });
  }

  async updateReportCard(id, updateData) {
    return prisma.$transaction(async (tx) => {
      const reportCard = await tx.reportCard.findUnique({
        where: { id },
        include: this._defaultIncludes(),
      });
      if (!reportCard) throw new Error("Bulletin introuvable");

      if (reportCard.file_path) {
        try {
          await fs.unlink(reportCard.file_path);
        } catch (error) {
          console.error("Erreur suppression fichier:", error);
        }
      }

      const [studentData, averagesRaw, grades] = await Promise.all([
        tx.student.findUnique({
          where: { id: reportCard.studentId },
          include: { class: true, user: true },
        }),
        tx.average.findMany({
          where: {
            studentId: reportCard.studentId,
            trimestreId: reportCard.trimestreId,
          },
          include: { subject: true },
        }),
        tx.grade.findMany({
          where: {
            studentId: reportCard.studentId,
            evaluation: { trimestreId: reportCard.trimestreId },
          },
          select: {
            subjectId: true,
            note: true,
            evaluation: {
              select: { type: true, titre: true, date_evaluation: true },
            },
            subject: { select: { coefficient: true } },
          },
        }),
      ]);

      const gradesBySubject = grades.reduce((acc, grade) => {
        if (!acc[grade.subjectId]) acc[grade.subjectId] = [];
        acc[grade.subjectId].push(grade);
        return acc;
      }, {});

      const averages = averagesRaw.map((avg) => {
        const subjectGrades = gradesBySubject[avg.subjectId] || [];
        const devoirs = subjectGrades
          .filter((g) => g.evaluation.type === "devoir")
          .map((g) => g.note);
        const composition =
          subjectGrades.find((g) => g.evaluation.type === "composition")
            ?.note || null;
        return {
          ...avg,
          devoir1: devoirs[0] || null,
          devoir2: devoirs[1] || null,
          composition,
          coefficient: avg.subject.coefficient,
        };
      });

      let totalPoints = 0;
      let totalCoef = 0;
      averages.forEach((avg) => {
        if (avg.moyenne !== null && avg.coefficient) {
          totalPoints += avg.moyenne * avg.coefficient;
          totalCoef += avg.coefficient;
        }
      });
      const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : 0;
      const appreciationGenerale =
        this.pdfHelper.getAppreciation(moyenneGenerale);
      const rangClasse = await this.calculateStudentRank(
        tx,
        reportCard.studentId,
        reportCard.trimestreId
      );

      const pdfResult = await this.pdfService.generateAndSaveReportCardPDF({
        ...reportCard,
        ...updateData,
        moyenne_generale: moyenneGenerale,
        appreciation_generale: appreciationGenerale,
        rang_classe: rangClasse,
        averages,
        student: studentData,
      });

      return tx.reportCard.update({
        where: { id },
        data: {
          ...updateData,
          moyenne_generale: moyenneGenerale,
          appreciation_generale: appreciationGenerale,
          rang_classe: rangClasse,
          chemin_fichier: pdfResult.publicUrl,
          file_path: pdfResult.filePath,
        },
        include: this._defaultIncludes(),
      });
    });
  }

  async getReportCardForDownload(id) {
    const reportCard = await prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, class: true } },
        trimestre: true,
      },
    });
    if (!reportCard) throw new Error("Bulletin introuvable");
    return {
      filePath: reportCard.file_path,
      publicUrl: reportCard.chemin_fichier,
      filename: `bulletin-${reportCard.student.user.nom}-${reportCard.trimestre.libelle}.pdf`,
    };
  }

  async deleteReportCardFile(id) {
    const reportCard = await prisma.reportCard.findUnique({
      where: { id },
      select: { file_path: true },
    });
    if (reportCard?.file_path) {
      try {
        await fs.unlink(reportCard.file_path);
      } catch (error) {
        console.error("Erreur suppression fichier:", error);
      }
    }
  }

  async getStudentReportCards(studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new Error("Élève introuvable");
    const reportCards = await prisma.reportCard.findMany({
      where: { studentId },
      include: {
        student: { include: { user: true, class: true } },
        trimestre: { include: { annee_scolaire: true } },
      },
      orderBy: { trimestre: { libelle: "asc" } },
    });
    const reportCardsWithAverages = await Promise.all(
      reportCards.map(async (rc) => {
        const averages = await prisma.average.findMany({
          where: { studentId: rc.studentId, trimestreId: rc.trimestreId },
          include: { subject: true },
        });
        return { ...rc, averages };
      })
    );
    return reportCardsWithAverages;
  }

  async calculateStudentRank(prismaClient, studentId, trimestreId) {
    const student = await prismaClient.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });
    if (!student?.classId) return null;
    const studentsInClass = await prismaClient.student.findMany({
      where: { classId: student.classId },
      select: { id: true },
    });
    const studentIds = studentsInClass.map((s) => s.id);
    const averages = await prismaClient.average.findMany({
      where: { studentId: { in: studentIds }, trimestreId },
      include: { subject: true },
    });

    const averagesByStudent = studentIds.map((id) => {
      const studentAverages = averages.filter((a) => a.studentId === id);
      let totalPoints = 0;
      let totalCoef = 0;
      studentAverages.forEach((avg) => {
        if (avg.moyenne !== null && avg.subject?.coefficient) {
          totalPoints += avg.moyenne * avg.subject.coefficient;
          totalCoef += avg.subject.coefficient;
        }
      });
      return {
        studentId: id,
        moyenneGenerale: totalCoef > 0 ? totalPoints / totalCoef : 0,
      };
    });

    averagesByStudent.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);

    let rank = 1;
    let lastMoyenne = null;
    let rankMap = {};
    averagesByStudent.forEach((s, index) => {
      if (lastMoyenne !== null && s.moyenneGenerale < lastMoyenne)
        rank = index + 1;
      rankMap[s.studentId] = rank;
      lastMoyenne = s.moyenneGenerale;
    });
    return rankMap[studentId] || null;
  }

  async deleteReportCard(id) {
    return prisma.$transaction(async (tx) => {
      const reportCard = await tx.reportCard.findUnique({
        where: { id },
        select: { file_path: true },
      });
      if (!reportCard) throw new Error("Bulletin introuvable");
      if (reportCard.file_path) {
        try {
          await fs.unlink(reportCard.file_path);
        } catch (error) {
          console.error("Erreur suppression fichier:", error);
        }
      }
      await tx.reportCard.delete({ where: { id } });
      return { message: "Bulletin et fichier supprimés avec succès" };
    });
  }

  async _verifyRelations(prismaClient, data) {
    const [student, trimestre] = await Promise.all([
      prismaClient.student.findUnique({
        where: { id: data.studentId },
        include: { class: true },
      }),
      prismaClient.trimestre.findUnique({ where: { id: data.trimestreId } }),
    ]);
    if (!student) throw new Error("Élève introuvable");
    if (!trimestre) throw new Error("Trimestre introuvable");
    if (!student.class)
      throw new Error("L'élève n'est pas affecté à une classe");
  }

  async _getAnneeScolaireId(prismaClient, trimestreId) {
    const trimestre = await prismaClient.trimestre.findUnique({
      where: { id: trimestreId },
      select: { anneeScolaireId: true },
    });
    return trimestre?.anneeScolaireId;
  }

  _defaultIncludes() {
    return {
      student: { include: { user: true, class: true } },
      trimestre: { include: { annee_scolaire: true } },
    };
  }
}
