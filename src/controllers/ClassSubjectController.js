import { HTTPException } from "hono/http-exception";
import ClassSubjectService from "../services/ClassSubjectService.js";
import ClassSubjectSchema from "../schemas/ClassSubjectSchema.js";

export default class ClassSubjectController {
  constructor() {
    this.service = new ClassSubjectService();
    this.validator = new ClassSubjectSchema();
  }

  async assignSubject(ctx) {
    try {
      const data = await ctx.req.json();
      this.validator.validateCreate(data);
      const result = await this.service.assignSubjectToClass(data);
      return ctx.json({ success: true, data: result }, 201);
    } catch (error) {
      const status = error.message.includes("introuvable") ? 404 : 
                    error.message.includes("déjà assignée") ? 409 : 400;
      throw new HTTPException(status, { message: error.message });
    }
  }

  async updateAssignment(ctx) {
    try {
      const id = parseInt(ctx.req.param("id"));
      const data = await ctx.req.json();
      this.validator.validateUpdate(data);
      const result = await this.service.updateAssignment(id, data);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getClassSubjects(ctx) {
    try {
      const classId = parseInt(ctx.req.param("classId"));
      const anneeScolaireId = parseInt(ctx.req.param("anneeScolaireId"));
      const result = await this.service.getClassSubjects(classId, anneeScolaireId);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getAllClassSubjects(ctx) {
    try {
      const anneeScolaireId = parseInt(ctx.req.param("anneeScolaireId"));
      const result = await this.service.getClassSubjects(anneeScolaireId);
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
}