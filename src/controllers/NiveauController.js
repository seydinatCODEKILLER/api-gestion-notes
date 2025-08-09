import { HTTPException } from "hono/http-exception";
import NiveauService from "../services/NiveauService.js";
import NiveauSchema from "../schemas/NiveauSchema.js";

export default class NiveauController {
  constructor() {
    this.service = new NiveauService();
    this.validator = new NiveauSchema();
  }

  async getAllNiveaux(ctx) {
    try {
      const { includeInactive, search, page, pageSize } = ctx.req.query();

      const niveaux = await this.service.getAllNiveaux({
        includeInactive: includeInactive === "true",
        search,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countNiveaux(includeInactive === "true");

      return ctx.json({
        success: true,
        data: niveaux,
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

  async createNiveau(ctx) {
    try {
      const formData = await ctx.req.json();
      this.validator.validateCreate(formData);

      const newNiveau = await this.service.createNiveau(formData);
      return ctx.json({ success: true, data: newNiveau }, 201);
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateNiveau(ctx) {
    try {
      const niveauId = parseInt(ctx.req.param("id"));
      if (isNaN(niveauId)) throw new Error("ID invalide");

      const formData = await ctx.req.json();
      this.validator.validateUpdate(formData);

      const updatedNiveau = await this.service.updateNiveau(niveauId, formData);
      return ctx.json({
        success: true,
        data: updatedNiveau,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async getNiveau(ctx) {
    try {
      const niveauId = parseInt(ctx.req.param("id"));
      if (isNaN(niveauId)) throw new Error("ID invalide");

      const niveau = await this.service.getNiveauById(niveauId);
      if (!niveau) throw new Error("Niveau non trouvé");

      return ctx.json({
        success: true,
        data: niveau,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const niveauId = parseInt(ctx.req.param("id"));
      if (isNaN(niveauId)) throw new Error("ID invalide");

      const result = await this.service.setNiveauStatus(niveauId, action);
      return ctx.json({
        success: true,
        message: `Niveau ${
          action === "restore" ? "réactivé" : "désactivé"
        } avec succès`,
        data: result,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async deleteNiveau(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreNiveau(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }
}
