import { prisma } from "../config/database.js";

export default class AlertService {
  async getAllAlerts(filters = {}) {
    const {
      studentId,
      subjectId,
      trimestre,
      type,
      statut,
      priorite,
      page = 1,
      pageSize = 10,
      includeResolved = false,
    } = filters;

    return prisma.alert.findMany({
      where: {
        studentId,
        subjectId,
        trimestre,
        type,
        statut: includeResolved ? undefined : { not: "resolu" },
        priorite,
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        subject: true,
      },
      orderBy: [{ date_creation: "desc" }, { priorite: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async createAlert(alertData) {
    return prisma.$transaction(async (tx) => {
      // Vérifier que l'élève existe
      const student = await tx.student.findUnique({
        where: { id: alertData.studentId },
      });
      if (!student) throw new Error("Élève introuvable");

      // Vérifier que la matière existe si fournie
      if (alertData.subjectId) {
        const subject = await tx.subject.findUnique({
          where: { id: alertData.subjectId },
        });
        if (!subject) throw new Error("Matière introuvable");
      }

      return tx.alert.create({
        data: {
          ...alertData,
          statut: "nouveau",
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          subject: true,
        },
      });
    });
  }

  async updateAlert(id, updateData) {
    return prisma.alert.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        subject: true,
      },
    });
  }

  async getAlertById(id) {
    return prisma.alert.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        subject: true,
      },
    });
  }

  async countAlerts(filters = {}) {
    const {
      studentId,
      subjectId,
      trimestre,
      type,
      statut,
      priorite,
      includeResolved = false,
    } = filters;

    return prisma.alert.count({
      where: {
        studentId,
        subjectId,
        trimestre,
        type,
        statut: includeResolved ? undefined : { not: "resolu" },
        priorite,
      },
    });
  }

  async getAlertsStats() {
    return prisma.$transaction([
      prisma.alert.count(),
      prisma.alert.count({ where: { statut: "nouveau" } }),
      prisma.alert.count({ where: { statut: "en_cours" } }),
      prisma.alert.count({ where: { statut: "resolu" } }),
      prisma.alert.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
    ]);
  }
}
