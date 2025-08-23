import { HTTPException } from "hono/http-exception";
import EvaluationService from "../services/EvaluationService.js";
import EvaluationSchema from "../schemas/EvaluationSchema.js";

export default class EvaluationController {
  constructor() {
    this.service = new EvaluationService();
    this.validator = new EvaluationSchema();
  }

  async getAllEvaluations(ctx) {
    try {
      const {
        classId,
        subjectId,
        teacherId,
        anneeScolaireId,
        trimestreId,
        page,
        pageSize,
      } = ctx.req.query();

      const evaluations = await this.service.getAllEvaluations({
        classId: classId ? parseInt(classId) : undefined,
        subjectId: subjectId ? parseInt(subjectId) : undefined,
        teacherId: teacherId ? parseInt(teacherId) : undefined,
        anneeScolaireId: anneeScolaireId
          ? parseInt(anneeScolaireId)
          : undefined,
        trimestreId: trimestreId ? parseInt(trimestreId) : undefined,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countEvaluations({
        classId: classId ? parseInt(classId) : undefined,
        subjectId: subjectId ? parseInt(subjectId) : undefined,
        teacherId: teacherId ? parseInt(teacherId) : undefined,
        anneeScolaireId: anneeScolaireId
          ? parseInt(anneeScolaireId)
          : undefined,
        trimestreId: trimestreId ? parseInt(trimestreId) : undefined,
      });

      return ctx.json({
        success: true,
        data: evaluations,
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

  async createEvaluation(ctx) {
    try {
      const data = await ctx.req.json();
      this.validator.validateCreate(data);
      const newEvaluation = await this.service.createEvaluation(data);
      return ctx.json({ success: true, data: newEvaluation }, 201);
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateEvaluation(ctx) {
    try {
      const evaluationId = parseInt(ctx.req.param("id"));
      if (isNaN(evaluationId)) throw new Error("ID invalide");

      const data = await ctx.req.json();
      this.validator.validateUpdate(data);
      const updatedEvaluation = await this.service.updateEvaluation(
        evaluationId,
        data
      );
      return ctx.json({ success: true, data: updatedEvaluation });
    } catch (error) {
      const statusCode = error.message.includes("non trouvée") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async deleteEvaluation(ctx) {
    try {
      const evaluationId = parseInt(ctx.req.param("id"));
      if (isNaN(evaluationId)) throw new Error("ID invalide");

      await this.service.deleteEvaluation(evaluationId);
      return ctx.json({
        success: true,
        message: "Évaluation supprimée avec succès",
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvée") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async getEvaluation(ctx) {
    try {
      const evaluationId = parseInt(ctx.req.param("id"));
      if (isNaN(evaluationId)) throw new Error("ID invalide");

      const evaluation = await this.service.getEvaluationById(evaluationId);
      if (!evaluation) throw new Error("Évaluation non trouvée");

      return ctx.json({ success: true, data: evaluation });
    } catch (error) {
      throw new HTTPException(404, { message: error.message });
    }
  }

  async getEvaluationsByClass(ctx) {
    try {
      const classId = parseInt(ctx.req.param("classId"));
      if (isNaN(classId)) throw new Error("ID de classe invalide");

      const { subjectId, trimestreId } = ctx.req.query();

      const evaluations = await this.service.getEvaluationsByClass(classId, {
        subjectId: subjectId ? parseInt(subjectId) : undefined,
        trimestreId: trimestreId ? parseInt(trimestreId) : undefined,
      });

      return ctx.json({ success: true, data: evaluations });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getEvaluationsByTeacher(ctx) {
    try {
      const teacherId = parseInt(ctx.req.param("teacherId"));
      if (isNaN(teacherId)) throw new Error("ID professeur invalide");

      const { classId, subjectId, trimestreId } = ctx.req.query();

      const evaluations = await this.service.getEvaluationsByTeacher(
        teacherId,
        {
          classId: classId ? parseInt(classId) : undefined,
          subjectId: subjectId ? parseInt(subjectId) : undefined,
          trimestreId: trimestreId ? parseInt(trimestreId) : undefined,
        }
      );

      return ctx.json({ success: true, data: evaluations });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getEvaluationStats(ctx) {
    try {
      const evaluationId = parseInt(ctx.req.param("id"));
      if (isNaN(evaluationId)) throw new Error("ID invalide");

      const stats = await this.service.getEvaluationStats(evaluationId);
      return ctx.json({ success: true, data: stats });
    } catch (error) {
      throw new HTTPException(500, { message: error.message });
    }
  }
}
