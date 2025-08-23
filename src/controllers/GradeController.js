import { HTTPException } from "hono/http-exception";
import GradeService from "../services/GradeService.js";
import GradeSchema from "../schemas/GradeSchema.js";

export default class GradeController {
  constructor() {
    this.service = new GradeService();
    this.validator = new GradeSchema();
  }

  async createGrade(ctx) {
    try {
      const data = await ctx.req.json();
      this.validator.validateCreate(data);

      const currentTeacherId = ctx.get("user").id;
      const result = await this.service.createGrade(data, currentTeacherId);

      return ctx.json({ success: true, data: result }, 201);
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async updateGrade(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      const data = await ctx.req.json();
      this.validator.validateUpdate(data);

      const currentTeacherId = ctx.get("user").id;
      const result = await this.service.updateGrade(id, data, currentTeacherId);

      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getStudentGrades(ctx) {
    try {
      const studentId = parseInt(ctx.req.param("studentId"));
      const currentTeacherId =
        ctx.get("user").role === "professeur" ? ctx.get("user").id : null;
      console.log(`Current Teacher ID: ${currentTeacherId}`);

      const filters = {
        subjectId: ctx.req.query("subjectId")
          ? parseInt(ctx.req.query("subjectId"))
          : undefined,
        trimestreId: ctx.req.query("trimestreId")
          ? parseInt(ctx.req.query("trimestreId"))
          : undefined,
        type_note: ctx.req.query("type_note"),
        anneeScolaireId: ctx.req.query("anneeScolaireId")
          ? parseInt(ctx.req.query("anneeScolaireId"))
          : undefined,
      };

      const result = await this.service.getGradesByStudent(
        studentId,
        filters,
        currentTeacherId
      );
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getClassGrades(ctx) {
    try {
      const classId = parseInt(ctx.req.param("classId"));
      const currentTeacherId =
        ctx.get("user").role === "professeur" ? ctx.get("user").id : null;

      const filters = {
        subjectId: ctx.req.query("subjectId")
          ? parseInt(ctx.req.query("subjectId"))
          : undefined,
        trimestreId: ctx.req.query("trimestreId")
          ? parseInt(ctx.req.query("trimestreId"))
          : undefined,
        anneeScolaireId: ctx.req.query("anneeScolaireId")
          ? parseInt(ctx.req.query("anneeScolaireId"))
          : undefined,
      };

      const result = await this.service.getGradesByClass(
        classId,
        filters,
        currentTeacherId
      );
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async deleteGrade(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      const currentTeacherId = ctx.get("user").id;

      await this.service.deleteGrade(id, currentTeacherId);
      return ctx.json({ success: true, message: "Note supprimée" });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  _getErrorStatus(error) {
    if (error.message.includes("introuvable")) return 404;
    if (error.message.includes("droit") || error.message.includes("auteur"))
      return 403;
    return 400;
  }
}
