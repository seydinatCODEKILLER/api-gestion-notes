import { HTTPException } from "hono/http-exception";
import TrimestreService from "../services/TrimestreService.js";
import TrimestreSchema from "../schemas/TrimestreSchema.js";

export default class TrimestreController {
  constructor() {
    this.service = new TrimestreService();
    this.validator = new TrimestreSchema();
  }

  async getAllTrimestres(ctx) {
    try {
      const { includeInactive, search, page, pageSize, anneeScolaireId } =
        ctx.req.query();

      const trimestres = await this.service.getAllTrimestres({
        includeInactive: includeInactive === "true",
        search,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
        anneeScolaireId: anneeScolaireId
          ? parseInt(anneeScolaireId)
          : undefined,
      });

      const total = await this.service.countTrimestres(
        includeInactive === "true",
        anneeScolaireId ? parseInt(anneeScolaireId) : undefined
      );

      return ctx.json({
        success: true,
        data: trimestres,
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

  async createTrimestre(ctx) {
    try {
      const formData = await ctx.req.json();
      const validatedData = this.validator.validateCreate(formData);

      const newTrimestre = await this.service.createTrimestre(validatedData);
      return ctx.json({ success: true, data: newTrimestre }, 201);
    } catch (error) {
      const statusCode = error.message.includes("existe déjà") ? 409 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async updateTrimestre(ctx) {
    try {
      const trimestreId = parseInt(ctx.req.param("id"));
      if (isNaN(trimestreId)) throw new Error("ID invalide");

      const formData = await ctx.req.json();
      const validatedData = this.validator.validateUpdate(formData);

      const updatedTrimestre = await this.service.updateTrimestre(
        trimestreId,
        validatedData
      );
      return ctx.json({
        success: true,
        data: updatedTrimestre,
      });
    } catch (error) {
      const statusCode = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async getTrimestre(ctx) {
    try {
      const trimestreId = parseInt(ctx.req.param("id"));
      if (isNaN(trimestreId)) throw new Error("ID invalide");

      const trimestre = await this.service.getTrimestreById(trimestreId);
      if (!trimestre) throw new Error("Trimestre introuvable");

      return ctx.json({
        success: true,
        data: trimestre,
      });
    } catch (error) {
      const statusCode = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const trimestreId = parseInt(ctx.req.param("id"));
      if (isNaN(trimestreId)) throw new Error("ID invalide");

      const result = await this.service.setTrimestreStatus(trimestreId, action);
      return ctx.json({
        success: true,
        message: `Trimestre ${
          action === "restore" ? "réactivé" : "désactivé"
        } avec succès`,
        data: result,
      });
    } catch (error) {
      const statusCode = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async deleteTrimestre(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreTrimestre(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }

  async getCurrentTrimestre(ctx) {
    try {
      const trimestre = await this.service.getCurrentTrimestre();
      if (!trimestre) throw new Error("Aucun trimestre actif trouvé");

      return ctx.json({
        success: true,
        data: trimestre,
      });
    } catch (error) {
      throw new HTTPException(404, { message: error.message });
    }
  }
}
