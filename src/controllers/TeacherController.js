import { HTTPException } from "hono/http-exception";
import TeacherService from "../services/TeacherService.js";
import TeacherValidator from "../schemas/TeacherSchema.js";

export default class TeacherController {
  constructor() {
    this.service = new TeacherService();
    this.validator = new TeacherValidator();
  }

  async getAllTeachers(ctx) {
    try {
      const { includeInactive, search, page, pageSize,includeSubjects} = ctx.req.query();

      const teachers = await this.service.getAllTeachers({
        includeInactive: includeInactive === "true",
        search,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
        includeSubjects: includeSubjects === "true",
      });

      const total = await this.service.countTeachers(
        includeInactive === "true"
      );

      return ctx.json({
        success: true,
        data: teachers,
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

  async createTeacher(ctx) {
    try {
      const formData = await ctx.req.parseBody();
      this.validator.validateCreate(formData);

      const newTeacher = await this.service.createTeacher(formData);
      return ctx.json({ success: true, data: newTeacher }, 201);
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateTeacher(ctx) {
    try {
      const teacherId = parseInt(ctx.req.param("id"));
      if (isNaN(teacherId)) throw new Error("ID invalide");

      const formData = await ctx.req.parseBody();
      this.validator.validateUpdate(formData);

      const updatedTeacher = await this.service.updateTeacher(
        teacherId,
        formData
      );
      return ctx.json({
        success: true,
        data: updatedTeacher,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async getTeacher(ctx) {
    try {
      const teacherId = parseInt(ctx.req.param("id"));
      if (isNaN(teacherId)) throw new Error("ID invalide");

      const teacher = await this.service.getTeacherById(teacherId);
      if (!teacher) throw new Error("Professeur non trouvé");

      return ctx.json({
        success: true,
        data: teacher,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const teacherId = parseInt(ctx.req.param("id"));
      if (isNaN(teacherId)) throw new Error("ID invalide");
      const result = await this.service.setTeacherStatus(teacherId, action);
      return ctx.json({
        success: true,
        message: `Professeur ${
          action === "restore" ? "réactivé" : "désactivé"
        } avec succès`,
        data: result,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async deleteTeacher(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreTeacher(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }

  async getStats(ctx) {
    try {
      const stats = await this.service.getStats();
      return ctx.json({ success: true, data: stats });
    } catch (error) {
      throw new HTTPException(500, { message: error.message });
    }
  }
}
