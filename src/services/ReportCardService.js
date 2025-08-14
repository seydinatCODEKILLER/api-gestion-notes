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

      // Récupérer les notes détaillées séparément
      const grades = await tx.grade.findMany({
        where: {
          studentId: data.studentId,
          trimestreId: data.trimestreId,
        },
        select: {
          subjectId: true,
          type_note: true,
          note: true,
          subject: {
            select: {
              coefficient: true,
            },
          },
        },
      });

      // Organiser les notes par matière
      const gradesBySubject = grades.reduce((acc, grade) => {
        if (!acc[grade.subjectId]) {
          acc[grade.subjectId] = [];
        }
        acc[grade.subjectId].push(grade);
        return acc;
      }, {});

      // Fusionner les données pour le PDF
      const averagesWithDetails = averages.map((avg) => {
        const subjectGrades = gradesBySubject[avg.subjectId] || [];

        const devoirs = subjectGrades
          .filter((g) => g.type_note === "devoir")
          .map((g) => g.note);
        const composition =
          subjectGrades.find((g) => g.type_note === "composition")?.note ||
          null;

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
      console.log("Rang de l'élève:", rangClasse);

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
      console.log(pdfResult);

      const result = tx.reportCard.create({
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
      console.log(result);
      return result;
    });
  }

  async updateReportCard(id, updateData) {
    return prisma.$transaction(async (tx) => {
      const reportCard = await tx.reportCard.findUnique({
        where: { id },
        include: this._defaultIncludes(),
      });

      if (!reportCard) throw new Error("Bulletin introuvable");

      // Supprimer l'ancien PDF si existant
      if (reportCard.file_path) {
        try {
          await fs.unlink(reportCard.file_path);
        } catch (error) {
          console.error("Erreur suppression fichier:", error);
        }
      }

      // Récupérer les données nécessaires
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
            trimestreId: reportCard.trimestreId,
          },
          select: {
            subjectId: true,
            type_note: true,
            note: true,
            subject: { select: { coefficient: true } },
          },
        }),
      ]);

      // Organiser les notes par matière
      const gradesBySubject = grades.reduce((acc, grade) => {
        if (!acc[grade.subjectId]) acc[grade.subjectId] = [];
        acc[grade.subjectId].push(grade);
        return acc;
      }, {});

      // Fusionner les données pour recalculer moyennes détaillées
      const averages = averagesRaw.map((avg) => {
        const subjectGrades = gradesBySubject[avg.subjectId] || [];
        const devoirs = subjectGrades
          .filter((g) => g.type_note === "devoir")
          .map((g) => g.note);
        const composition =
          subjectGrades.find((g) => g.type_note === "composition")?.note ||
          null;

        return {
          ...avg,
          devoir1: devoirs[0] || null,
          devoir2: devoirs[1] || null,
          composition,
          coefficient: avg.subject.coefficient,
        };
      });

      // Recalcul de la moyenne générale
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

      // Recalcul du rang
      const rangClasse = await this.calculateStudentRank(
        tx,
        reportCard.studentId,
        reportCard.trimestreId
      );

      // Génération du nouveau PDF
      const pdfResult = await this.pdfService.generateAndSaveReportCardPDF({
        ...reportCard,
        ...updateData,
        moyenne_generale: moyenneGenerale,
        appreciation_generale: appreciationGenerale,
        rang_classe: rangClasse,
        averages,
        student: studentData,
      });

      // Mise à jour du bulletin dans la BDD
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

  async getReportCardForDownload(id, user) {
    const reportCard = await prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        trimestre: true,
      },
    });

    if (!reportCard) {
      throw new Error("Bulletin introuvable");
    }

    await this.verifyReportCardAccess(user, reportCard);

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
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        trimestre: {
          include: { annee_scolaire: true },
        },
      },
      orderBy: { trimestre: { libelle: "asc" } },
    });
    const reportCardsWithAverages = await Promise.all(
      reportCards.map(async (rc) => {
        const averages = await prisma.average.findMany({
          where: {
            studentId: rc.studentId,
            trimestreId: rc.trimestreId,
          },
          include: { subject: true },
        });
        return {
          ...rc,
          averages,
        };
      })
    );

    return reportCardsWithAverages;
  }

  async getClassReportCards(classId, trimestreId) {
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classExists) throw new Error("Classe introuvable");
    return prisma.reportCard.findMany({
      where: {
        student: { classId },
        trimestreId,
      },
      include: {
        ...this._defaultIncludes(),
        student: {
          include: {
            user: true,
            averages: {
              where: { trimestreId },
              include: { subject: true },
            },
          },
        },
      },
      orderBy: [{ rang_classe: "asc" }, { student: { user: { nom: "asc" } } }],
    });
  }

  async verifyStudentAccess(user, studentId) {
    if (user.role === "eleve" && user.id !== studentId) {
      throw new Error("Accès non autorisé");
    }
  }

  async verifyClassAccess(user, classId) {
    if (user.role === "professeur") {
      const teachesClass = await prisma.teacher.count({
        where: {
          userId: user.id,
          classSubjects: { some: { classId } },
        },
      });

      if (!teachesClass) {
        throw new Error("Vous n'êtes pas autorisé à accéder à cette classe");
      }
    }
  }

  async verifyReportCardAccess(user, reportCard) {
    if (user.role === "eleve" && reportCard.student.userId !== user.id) {
      throw new Error("Accès non autorisé");
    }

    if (user.role === "professeur") {
      const teachesClass = await prisma.teacher.count({
        where: {
          userId: user.id,
          classSubjects: { some: { classId: reportCard.student.classId } },
        },
      });

      if (!teachesClass) {
        throw new Error("Accès non autorisé");
      }
    }
  }

  async calculateStudentRank(prismaClient, studentId, trimestreId) {
    // Récupérer l'élève et sa classe
    const student = await prismaClient.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });
    if (!student?.classId) return null;

    // Récupérer tous les élèves de la même classe
    const studentsInClass = await prismaClient.student.findMany({
      where: { classId: student.classId },
      select: { id: true },
    });
    if (!studentsInClass.length) return null;

    const studentIds = studentsInClass.map((s) => s.id);

    // Récupérer toutes les moyennes des élèves de la classe pour ce trimestre
    const averages = await prismaClient.average.findMany({
      where: {
        studentId: { in: studentIds },
        trimestreId,
      },
      include: { subject: true },
    });

    // Calculer la moyenne générale de chaque élève
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

    // Trier par moyenne décroissante
    averagesByStudent.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);

    // Calculer le rang en gérant les égalités
    let rank = 1;
    let lastMoyenne = null;
    let rankMap = {}; // studentId -> rang

    averagesByStudent.forEach((s, index) => {
      if (lastMoyenne !== null && s.moyenneGenerale < lastMoyenne) {
        rank = index + 1;
      }
      rankMap[s.studentId] = rank;
      lastMoyenne = s.moyenneGenerale;
    });

    return rankMap[studentId] || null;
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
