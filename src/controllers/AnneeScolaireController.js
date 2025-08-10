import { HTTPException } from "hono/http-exception";
import AnneeScolaireService from "../services/AnneeScolaireService.js";
import AnneeScolaireSchema from "../schemas/AnneeScolaireSchema.js";

export default class AnneeScolaireController {
  constructor() {
    this.service = new AnneeScolaireService();
    this.validator = new AnneeScolaireSchema();
  }

  async getAllAnnees(ctx) {
    try {
      const { search, page, pageSize } = ctx.req.query();

      const annees = await this.service.getAllAnnees({
        search,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countAnnees();

      return ctx.json({
        success: true,
        data: annees,
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

  async createAnnee(ctx) {
    try {
      const formData = await ctx.req.json();
      this.validator.validateCreate(formData);

      const newAnnee = await this.service.createAnnee(formData);
      return ctx.json({ success: true, data: newAnnee }, 201);
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateAnnee(ctx) {
    try {
      const anneeId = parseInt(ctx.req.param("id"));
      if (isNaN(anneeId)) throw new Error("ID invalide");

      const formData = await ctx.req.json();
      this.validator.validateUpdate(formData);

      const updatedAnnee = await this.service.updateAnnee(anneeId, formData);
      return ctx.json({
        success: true,
        data: updatedAnnee,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvée") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async getAnnee(ctx) {
    try {
      const anneeId = parseInt(ctx.req.param("id"));
      if (isNaN(anneeId)) throw new Error("ID invalide");

      const annee = await this.service.getAnneeById(anneeId);
      if (!annee) throw new Error("Année scolaire non trouvée");

      return ctx.json({
        success: true,
        data: annee,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvée") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async getActiveAnnee(ctx) {
    try {
      const activeAnnee = await this.service.getActiveAnnee();
      if (!activeAnnee) throw new Error("Aucune année active définie");

      return ctx.json({
        success: true,
        data: activeAnnee,
      });
    } catch (error) {
      throw new HTTPException(404, { message: error.message });
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const anneeId = parseInt(ctx.req.param("id"));
      if (isNaN(anneeId)) throw new Error("ID invalide");

      const result = await this.service.setAnneeStatus(anneeId, action);
      return ctx.json({
        success: true,
        message: `Annee ${
          action === "restore" ? "réactivé" : "désactivé"
        } avec succès`,
        data: result,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async deleteAnnee(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreAnnee(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }
}
