import { HTTPException } from "hono/http-exception";
import AlertService from "../services/AlertService.js";
import AlertSchema from "../schemas/AlertSchema.js";

export default class AlertController {
  constructor() {
    this.service = new AlertService();
    this.validator = new AlertSchema();
  }

  async getAllAlerts(ctx) {
    try {
      const {
        studentId,
        subjectId,
        trimestre,
        type,
        statut,
        priorite,
        page,
        pageSize,
        includeResolved,
      } = ctx.req.query();

      const alerts = await this.service.getAllAlerts({
        studentId: studentId ? parseInt(studentId) : undefined,
        subjectId: subjectId ? parseInt(subjectId) : undefined,
        trimestre: trimestre ? parseInt(trimestre) : undefined,
        type,
        statut,
        priorite,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
        includeResolved: includeResolved === "true",
      });

      const total = await this.service.countAlerts({
        studentId: studentId ? parseInt(studentId) : undefined,
        subjectId: subjectId ? parseInt(subjectId) : undefined,
        trimestre: trimestre ? parseInt(trimestre) : undefined,
        type,
        statut,
        priorite,
        includeResolved: includeResolved === "true",
      });

      return ctx.json({
        success: true,
        data: alerts,
        pagination: {
          total,
          page: parseInt(page) || 1,
          pageSize: parseInt(pageSize) || 10,
          totalPages: Math.ceil(total / (parseInt(pageSize) || 10)),
        },
      });
    } catch (error) {
      throw new HTTPException(500, { message: error.message });
    }
  }

  async createAlert(ctx) {
    try {
      const data = await ctx.req.json();
      const validatedData = this.validator.validateCreate(data);

      const newAlert = await this.service.createAlert(validatedData);
      return ctx.json({ success: true, data: newAlert }, 201);
    } catch (error) {
      const status = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(status, { message: error.message });
    }
  }

  async updateAlert(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "ID invalide" });
      }
      const data = await ctx.req.json();
      const validatedData = this.validator.validateUpdate(data);

      const updatedAlert = await this.service.updateAlert(id, validatedData);
      return ctx.json({ success: true, data: updatedAlert });
    } catch (error) {
      const status = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getAlert(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
    if (isNaN(id)) throw new HTTPException(400, { message: "ID invalide" });
      const alert = await this.service.getAlertById(id);

      if (!alert) {
        throw new Error("Alerte introuvable");
      }

      return ctx.json({ success: true, data: alert });
    } catch (error) {
      const status = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getAlertsStats(ctx) {
    try {
      const [total, nouveau, enCours, resolu, byType] =
        await this.service.getAlertsStats();

      return ctx.json({
        success: true,
        data: {
          total,
          statuts: { nouveau, enCours, resolu },
          byType: byType.map((t) => ({
            type: t.type,
            count: t._count._all,
          })),
        },
      });
    } catch (error) {
      throw new HTTPException(500, { message: error.message });
    }
  }
}
