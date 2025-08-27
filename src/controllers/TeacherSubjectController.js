import { HTTPException } from "hono/http-exception";
import TeacherSubjectService from "../services/TeacherSubjectService.js";
import TeacherSubjectSchema from "../schemas/TeacherSubjectSchema.js";

export default class TeacherSubjectController {
  constructor() {
    this.service = new TeacherSubjectService();
    this.validator = new TeacherSubjectSchema();
  }

  async assignSubject(ctx) {
    try {
      const data = await ctx.req.json();
      this.validator.validateCreate(data);
      const result = await this.service.assignSubjectToTeacher(data);
      return ctx.json({ success: true, data: result }, 201);
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getTeacherSubjects(ctx) {
    try {
      const teacherId = parseInt(ctx.req.param("teacherId"));
      const result = await this.service.getTeacherSubjects(teacherId);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getTeacherSubjectsForTeacher(ctx) {
    try {
      const teacherId = parseInt(ctx.req.param("teacherId"));
      const result = await this.service.getTeacherSubjectsForTeacher(teacherId);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async removeAssignment(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      await this.service.removeAssignment(id);
      return ctx.json({ success: true, message: "Assignation supprimée" });
    } catch (error) {
      const status = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getAllAssociations(ctx) {
    try {
      const result = await this.service.getAllAssociations();
      return ctx.json({
        success: true,
        data: result,
        count: result.length,
      });
    } catch (error) {
      throw new HTTPException(500, {
        message: "Erreur lors de la récupération des associations",
        details: error.message,
      });
    }
  }

  async getAssociation(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      const result = await this.service.getAssociation(id);
      return ctx.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const status = error.message.includes("introuvable") ? 404 : 500;
      throw new HTTPException(status, {
        message: error.message,
      });
    }
  }
}
