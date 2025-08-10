import { HTTPException } from "hono/http-exception";
import SubjectService from "../services/SubjectService.js";
import SubjectSchema from "../schemas/SubjectSchema.js";

export default class SubjectController {
  constructor() {
    this.service = new SubjectService();
    this.validator = new SubjectSchema();
  }

  async getAllSubjects(ctx) {
    try {
      const { includeInactive, search, page, pageSize } = ctx.req.query();
      const subjects = await this.service.getAllSubjects({
        includeInactive: includeInactive === "true",
        search,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countSubject(includeInactive === "true");

      return ctx.json({
        success: true,
        data: subjects,
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

  async createSubject(ctx) {
    try {
      const data = await ctx.req.json();
      this.validator.validateCreate(data);
      const newSubject = await this.service.createSubject(data);
      return ctx.json({ success: true, data: newSubject }, 201);
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateSubject(ctx) {
    try {
      const subjectId = parseInt(ctx.req.param("id"));
      if (isNaN(subjectId)) throw new Error("ID invalide");

      const data = await ctx.req.json();
      this.validator.validateUpdate(data);
      const updatedSubject = await this.service.updateSubject(subjectId, data);
      return ctx.json({ success: true, data: updatedSubject });
    } catch (error) {
      const statusCode = error.message.includes("non trouvée") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const subjectId = parseInt(ctx.req.param("id"));
      if (isNaN(subjectId)) throw new Error("ID invalide");

      const result = await this.service.setSubjectStatus(subjectId, action);
      return ctx.json({
        success: true,
        message: `Matière ${action === "restore" ? "réactivée" : "désactivée"}`,
        data: result,
      });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async deleteSubject(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreSubject(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }

  async getSubject(ctx) {
    try {
      const subjectId = parseInt(ctx.req.param("id"));
      if (isNaN(subjectId)) throw new Error("ID invalide");

      const subject = await this.service.getSubjectById(subjectId);
      if (!subject) throw new Error("Matière non trouvée");

      return ctx.json({ success: true, data: subject });
    } catch (error) {
      throw new HTTPException(404, { message: error.message });
    }
  }
}
