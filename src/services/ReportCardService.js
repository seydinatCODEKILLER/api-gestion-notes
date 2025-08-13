import CloudinaryUploader from "utils/CloudinaryUploader.js";
import { prisma } from "../config/database.js";
import PDFService from "./PDFService.js";

export default class ReportCardService {
  constructor() {
    this.pdfService = new PDFService();
    this.cloudinaryUploader = new CloudinaryUploader('bulletins');
  }

  async generateReportCard(data) {
    return prisma.$transaction(async (tx) => {
      await this._verifyRelations(tx, data);

      const existing = await tx.reportCard.findUnique({
        where: {
          studentId_trimestreId: {
            studentId: data.studentId,
            trimestreId: data.trimestreId
          }
        }
      });

      if (existing) {
        throw new Error("Un bulletin existe déjà pour cet élève et ce trimestre");
      }

      const averages = await tx.average.findMany({
        where: {
          studentId: data.studentId,
          trimestreId: data.trimestreId
        },
        include: { subject: true }
      });

      // Génération du PDF
      const pdfBuffer = await this.pdfService.generateReportCardPDF({
        ...data,
        averages,
        student: await tx.student.findUnique({
          where: { id: data.studentId },
          include: { user: true, class: true }
        }),
        trimestre: await tx.trimestre.findUnique({
          where: { id: data.trimestreId }
        })
      });

      // Upload vers Cloudinary
      const uploadResult = await this.cloudinaryUploader.uploadPDF(
        pdfBuffer,
        `bulletin_${data.studentId}_${data.trimestreId}`
      );

      return tx.reportCard.create({
        data: {
          ...data,
          chemin_fichier: uploadResult.secure_url,
          cloudinary_public_id: uploadResult.public_id,
          anneeScolaireId: await this._getAnneeScolaireId(tx, data.trimestreId)
        },
        include: this._defaultIncludes()
      });
    });
  }

  async updateReportCard(id, updateData) {
    return prisma.$transaction(async (tx) => {
      const reportCard = await tx.reportCard.findUnique({ 
        where: { id },
        include: this._defaultIncludes()
      });
      
      if (!reportCard) throw new Error("Bulletin introuvable");

      // Supprimer l'ancien fichier sur Cloudinary
      if (reportCard.cloudinary_public_id) {
        await this.cloudinaryUploader.delete(reportCard.cloudinary_public_id);
      }

      // Récupérer les données nécessaires
      const [studentData, averages] = await Promise.all([
        tx.student.findUnique({
          where: { id: reportCard.studentId },
          include: { class: true, user: true }
        }),
        tx.average.findMany({
          where: {
            studentId: reportCard.studentId,
            trimestreId: reportCard.trimestreId
          },
          include: { subject: true }
        })
      ]);

      // Regénérer le PDF
      const pdfBuffer = await this.pdfService.generateReportCardPDF({
        ...reportCard,
        ...updateData,
        student: studentData,
        averages
      });

      // Upload du nouveau PDF
      const uploadResult = await this.cloudinaryUploader.uploadPDF(
        pdfBuffer,
        `bulletin_${reportCard.studentId}_${reportCard.trimestreId}_updated`
      );

      return tx.reportCard.update({
        where: { id },
        data: {
          ...updateData,
          chemin_fichier: uploadResult.secure_url,
          cloudinary_public_id: uploadResult.public_id
        },
        include: this._defaultIncludes()
      });
    });
  }

  async getStudentReportCards(studentId) {
    return prisma.reportCard.findMany({
      where: { studentId },
      include: {
        ...this._defaultIncludes(),
        averages: { include: { subject: true } }
      },
      orderBy: { trimestre: { libelle: 'asc' } }
    });
  }

  async getClassReportCards(classId, trimestreId) {
    return prisma.reportCard.findMany({
      where: {
        student: { classId },
        trimestreId
      },
      include: {
        ...this._defaultIncludes(),
        student: { 
          include: { 
            user: true,
            averages: {
              where: { trimestreId },
              include: { subject: true }
            }
          } 
        }
      },
      orderBy: [{ rang_classe: 'asc' }, { student: { user: { nom: 'asc' } }}]
    });
  }

  async getReportCardForDownload(id, user) {
    const reportCard = await prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
            class: true
          }
        },
        trimestre: true
      }
    });

    if (!reportCard) {
      throw new Error("Bulletin introuvable");
    }

    // Vérification des permissions
    await this.verifyReportCardAccess(user, reportCard);

    // Téléchargement depuis Cloudinary
    const pdfBuffer = await this.cloudinaryUploader.download(reportCard.cloudinary_public_id);
    
    return {
      pdfUrl: reportCard.chemin_fichier,
      filename: `bulletin-${reportCard.student.user.nom}-${reportCard.trimestre.libelle}.pdf`,
    };

  }

  async verifyStudentAccess(user, studentId) {
    if (user.role === 'eleve' && user.id !== studentId) {
      throw new Error("Accès non autorisé");
    }
  }

  async verifyClassAccess(user, classId) {
    if (user.role === 'professeur') {
      const teachesClass = await prisma.teacher.count({
        where: {
          userId: user.id,
          classSubjects: { some: { classId } }
        }
      });
      
      if (!teachesClass) {
        throw new Error("Vous n'êtes pas autorisé à accéder à cette classe");
      }
    }
  }

  async verifyReportCardAccess(user, reportCard) {
    if (user.role === 'eleve' && reportCard.student.userId !== user.id) {
      throw new Error("Accès non autorisé");
    }

    if (user.role === 'professeur') {
      const teachesClass = await prisma.teacher.count({
        where: {
          userId: user.id,
          classSubjects: { some: { classId: reportCard.student.classId } }
        }
      });
      
      if (!teachesClass) {
        throw new Error("Accès non autorisé");
      }
    }
  }

  // Méthodes privées
  async _verifyRelations(prismaClient, data) {
    const [student, trimestre] = await Promise.all([
      prismaClient.student.findUnique({ 
        where: { id: data.studentId },
        include: { class: true }
      }),
      prismaClient.trimestre.findUnique({ where: { id: data.trimestreId } })
    ]);

    if (!student) throw new Error("Élève introuvable");
    if (!trimestre) throw new Error("Trimestre introuvable");
    if (!student.class) throw new Error("L'élève n'est pas affecté à une classe");
  }

  async _getAnneeScolaireId(prismaClient, trimestreId) {
    const trimestre = await prismaClient.trimestre.findUnique({
      where: { id: trimestreId },
      select: { anneeScolaireId: true }
    });
    return trimestre?.anneeScolaireId;
  }

  _defaultIncludes() {
    return {
      student: { include: { user: true, class: true } },
      trimestre: { include: { annee_scolaire: true } }
    };
  }
}