import { HTTPException } from "hono/http-exception";
import ClassService from "../services/ClassService.js";
import ClassSchema from "../schemas/ClassSchema.js";

export default class ClassController {
  constructor() {
    this.service = new ClassService();
    this.validator = new ClassSchema();
  }

  async getAllClasses(ctx) {
    try {
      const { includeInactive, search, page, pageSize } = ctx.req.query();
      const classes = await this.service.getAllClasses({
        includeInactive: includeInactive === "true",
        search,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countClasse();

      return ctx.json({
        success: true,
        data: classes,
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

  async createClass(ctx) {
    try {
      const data = await ctx.req.json();
      this.validator.validateCreate(data);
      const newClass = await this.service.createClass(data);
      return ctx.json({ success: true, data: newClass }, 201);
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateClass(ctx) {
    try {
      const classId = parseInt(ctx.req.param("id"));
      if (isNaN(classId)) throw new Error("ID invalide");

      const data = await ctx.req.json();
      this.validator.validateUpdate(data);
      const updatedClass = await this.service.updateClass(classId, data);
      return ctx.json({ success: true, data: updatedClass });
    } catch (error) {
      const statusCode = error.message.includes("non trouvée") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const classId = parseInt(ctx.req.param("id"));
      if (isNaN(classId)) throw new Error("ID invalide");

      const result = await this.service.setClassStatus(classId, action);
      return ctx.json({
        success: true,
        message: `Classe ${action === "restore" ? "réactivée" : "désactivée"}`,
        data: result,
      });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async deleteClass(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreClass(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }

  async getClass(ctx) {
    try {
      const classId = parseInt(ctx.req.param("id"));
      if (isNaN(classId)) throw new Error("ID invalide classe");

      const classe = await this.service.getClassById(classId);
      if (!classe) throw new Error("Classe non trouvée");

      return ctx.json({ success: true, data: classe });
    } catch (error) {
      throw new HTTPException(404, { message: error.message });
    }
  }

  async getStats(ctx) {
    try {
      const stats = await this.service.getStats();
      return ctx.json({ success: true, data: stats });
    } catch (error) {
      throw new HTTPException(500, { message: error.message });
    }
  }

  async getClassesByTeacher(ctx) {
    try {
      const teacherId = parseInt(ctx.req.param("teacherId"));
      if (isNaN(teacherId)) throw new Error("ID professeur invalide");

      const classes = await this.service.getClassesByTeacher(teacherId);

      return ctx.json({ success: true, data: classes });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }
  
  async getClassWithStudents(ctx) {
    try {
      const classId = parseInt(ctx.req.param("id"));
      if (isNaN(classId)) throw new Error("ID de classe invalide");

      const classe = await this.service.getClassWithStudents(classId);
      if (!classe) throw new Error("Classe introuvable");

      return ctx.json({
        success: true,
        data: {
          ...classe,
          effectif: classe.students.length,
        },
      });
    } catch (error) {
      const status = error.message.includes("introuvable") ? 404 : 400;
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getStudentsByClass(ctx) {
    try {
      const classId = parseInt(ctx.req.param("id"));
      if (isNaN(classId)) throw new Error("ID de classe invalide");
  
      const students = await this.service.getStudentsByClass(classId)
  
      return ctx.json({ success: true, data: students });
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }
}
