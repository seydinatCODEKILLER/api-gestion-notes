import { HTTPException } from "hono/http-exception";
import ReportCardService from "../services/ReportCardService.js";
import ReportCardSchema from "../schemas/ReportCardSchema.js";
import { Hono } from "hono";
import fs from "fs/promises";

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
      if (isNaN(id)) throw new Error("L'ID de la fiche de notes doit être un nombre valide");
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
      if (isNaN(studentId)) throw new Error("L'ID de l'élève doit être un nombre valide");
      const user = ctx.get("user");
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
      if (isNaN(classId)) throw new Error("L'ID de la classe doit être un nombre valide");
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

  _getErrorStatus(error) {
    if (error.message.includes("introuvable")) return 404;
    if (
      error.message.includes("autorisé") ||
      error.message.includes("autorisée")
    )
      return 403;
    return 400;
  }

  async downloadReportCard(ctx) {
    try {
      const id = Number(ctx.req.param("id"));
      // const user = ctx.get("user");

      const { filePath, filename } =
        await this.service.getReportCardForDownload(id);

      // Lire le fichier en Buffer
      const fileBuffer = await fs.readFile(filePath);

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error(error);
      throw new HTTPException(500, { message: error.message });
    }
  }

  async getAllReportCards(ctx) {
  try {
    const result = await this.service.getAllReportCards();
    return ctx.json({ success: true, data: result });
  } catch (error) {
    const status = this._getErrorStatus(error);
    throw new HTTPException(status, { message: error.message });
  }
}

  async deleteReportCard(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      if (isNaN(id)) throw new Error("L'ID du bulletin doit être un nombre valide");

      await this.service.deleteReportCard(id);
      
      return ctx.json({ 
        success: true, 
        message: "Bulletin supprimé avec succès" 
      });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

}
