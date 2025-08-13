import { HTTPException } from "hono/http-exception";
import ReportCardService from "../services/ReportCardService.js";
import ReportCardSchema from "../schemas/ReportCardSchema.js";

export default class ReportCardController {
  constructor() {
    this.service = new ReportCardService();
    this.validator = new ReportCardSchema();
  }

  async generateReportCard(ctx) {
    try {
      const data = await ctx.req.json();
      const validatedData = this.validator.validateCreate(data);

      const result = await this.service.generateReportCard(validatedData);
      return ctx.json({ success: true, data: result }, 201);
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async updateReportCard(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      const data = await ctx.req.json();
      const validatedData = this.validator.validateUpdate(data);

      const result = await this.service.updateReportCard(id, validatedData);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getStudentReportCards(ctx) {
    try {
      const studentId = parseInt(ctx.req.param("studentId"));
      const user = ctx.get("user");

      // Vérification des droits via le service
      await this.service.verifyStudentAccess(user, studentId);

      const result = await this.service.getStudentReportCards(studentId);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getClassReportCards(ctx) {
    try {
      const classId = parseInt(ctx.req.param("classId"));
      const trimestreId = parseInt(ctx.req.query("trimestreId"));
      const user = ctx.get("user");

      if (!trimestreId) throw new Error("Le paramètre trimestreId est requis");

      // Vérification des droits via le service
      await this.service.verifyClassAccess(user, classId);

      const result = await this.service.getClassReportCards(
        classId,
        trimestreId
      );
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async downloadReportCard(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      const user = ctx.get("user");

      const { pdfUrl, filename } = await this.service.getReportCardForDownload(
        id,
        user
      );

      return ctx.redirect(pdfUrl);
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  _getErrorStatus(error) {
    if (error.message.includes("introuvable")) return 404;
    if (
      error.message.includes("autorisé") ||
      error.message.includes("autorisée")
    )
      return 403;
    return 400;
  }
}
