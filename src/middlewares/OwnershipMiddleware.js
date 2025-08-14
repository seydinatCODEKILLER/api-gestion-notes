import { HTTPException } from "hono/http-exception";
import { prisma } from "../config/database.js";

export default class OwnershipMiddleware {

  async checkTeacherSubjectAccess(ctx, next) {
    if (ctx.get("user").role === "admin") return next();

    const teacher = await prisma.teacher.findUnique({
      where: { userId: ctx.get("user").id },
      select: { id: true, teacherSubjects: { select: { subjectId: true } } },
    });

    if (!teacher) throw new HTTPException(403, { message: "Accès refusé" });

    // Pour POST /averages (création manuelle)
    if (ctx.req.method === "POST") {
      const body = await ctx.req.json();
      const hasAccess = teacher.teacherSubjects.some(
        (ts) => ts.subjectId === body.subjectId
      );

      if (!hasAccess) {
        throw new HTTPException(403, {
          message: "Vous n'enseignez pas cette matière",
        });
      }
    }

    return next();
  }

  async checkTeacherClassAccess(ctx, next) {
    if (ctx.get("user").role === "admin") return next();

    const classId = parseInt(ctx.req.param("classId"));
    const teacher = await prisma.teacher.findUnique({
      where: { userId: ctx.get("user").id },
      select: {
        classSubjects: {
          where: { classId },
          select: { classId: true },
        },
      },
    });

    if (!teacher || teacher.classSubjects.length === 0) {
      throw new HTTPException(403, {
        message: "Vous n'êtes pas assigné à cette classe",
      });
    }

    return next();
  }

  async checkStudentAccess(ctx, next) {
    const user = ctx.get("user");
    const studentId = parseInt(ctx.req.param("studentId"));

    if (user.role === "admin") return next();

    if (user.role === "professeur") {
      const teachesStudent = await prisma.teacher.findFirst({
        where: {
          userId: user.id,
          classSubjects: {
            some: {
              class: {
                students: {
                  some: { id: studentId },
                },
              },
            },
          },
        },
      });

      if (teachesStudent) return next();
    }

    // Élève: vérifier que c'est bien son propre profil
    if (user.role === "eleve") {
      const isSelf = await prisma.student.findFirst({
        where: {
          id: studentId,
          userId: user.id,
        },
      });

      if (isSelf) return next();
    }

    throw new HTTPException(403, { message: "Accès non autorisé" });
  }

  async checkReportCardAccess(ctx, next) {
    const user = ctx.get("user");
    const reportCardId = parseInt(ctx.req.param("id"));

    if (user.role === "admin") return next();

    const reportCard = await prisma.reportCard.findUnique({
      where: { id: reportCardId },
      select: {
        student: {
          select: {
            userId: true,
            classId: true,
          },
        },
      },
    });

    if (!reportCard) {
      throw new HTTPException(404, { message: "Bulletin introuvable" });
    }

    // Élève: vérifier que c'est son propre bulletin
    if (user.role === "eleve" && reportCard.student.userId !== user.id) {
      throw new HTTPException(403, { message: "Accès non autorisé" });
    }

    // Professeur: vérifier qu'il enseigne dans cette classe
    if (user.role === "professeur") {
      const teachesClass = await prisma.teacher.count({
        where: {
          userId: user.id,
          classSubjects: {
            some: {
              classId: reportCard.student.classId,
            },
          },
        },
      });

      if (!teachesClass) {
        throw new HTTPException(403, { message: "Accès non autorisé" });
      }
    }

    return await next();
  }

  async checkAlertAccess(ctx, next) {
    const user = ctx.get("user");
    const alertId = parseInt(ctx.req.param("id"));

    // Admins ont un accès complet
    if (user.role === "admin") {
      return next();
    }

    // Récupérer l'alerte avec les informations nécessaires
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: {
        student: {
          select: {
            userId: true,
            classId: true,
          },
        },
        subjectId: true,
      },
    });

    if (!alert) {
      throw new HTTPException(404, {
        message: "L'alerte demandée n'existe pas",
      });
    }

    // Vérification des permissions selon le rôle
    switch (user.role) {
      case "eleve":
        await this._verifyStudentAccess(user.id, alert.student.userId);
        break;

      case "professeur":
        await this._verifyTeacherAccess(user.id, alert);
        break;

      default:
        throw new HTTPException(403, {
          message: "Votre rôle ne vous permet pas d'accéder à cette alerte",
        });
    }

    return next();
  }

  async _verifyStudentAccess(userId, alertStudentId) {
    if (userId !== alertStudentId) {
      throw new HTTPException(403, {
        message: "Vous ne pouvez accéder qu'à vos propres alertes",
      });
    }
  }

  async _verifyTeacherAccess(userId, alert) {
    const { subjectId, student } = alert;

    // Vérifier l'accès selon le type d'alerte
    if (subjectId) {
      // Alerte liée à une matière spécifique
      const canAccessSubject = await this._teacherTeachesSubject(
        userId,
        subjectId
      );

      if (!canAccessSubject) {
        throw new HTTPException(403, {
          message: "Vous n'enseignez pas la matière concernée par cette alerte",
        });
      }
    } else {
      // Alerte générale - vérifier l'accès à la classe
      const canAccessClass = await this._teacherTeachesInClass(
        userId,
        student.classId
      );

      if (!canAccessClass) {
        throw new HTTPException(403, {
          message:
            "Vous n'enseignez pas dans la classe concernée par cette alerte",
        });
      }
    }
  }

  async _teacherTeachesSubject(teacherUserId, subjectId) {
    return (
      (await prisma.teacherSubject.count({
        where: {
          teacher: { userId: teacherUserId },
          subjectId,
        },
      })) > 0
    );
  }

  async _teacherTeachesInClass(teacherUserId, classId) {
    return (
      (await prisma.classSubject.count({
        where: {
          teacher: { userId: teacherUserId },
          classId,
        },
      })) > 0
    );
  }
}
