import { HTTPException } from "hono/http-exception";
import StudentService from "../services/StudentService.js";
import StudentValidator from "../schemas/StudentSchema.js";

export default class StudentController {
  constructor() {
    this.service = new StudentService();
    this.validator = new StudentValidator();
  }

  async getAllStudents(ctx) {
    try {
      const { includeInactive, search, page, pageSize, classId } =
        ctx.req.query();

      const students = await this.service.getAllStudents({
        includeInactive: includeInactive === "true",
        search,
        classId: classId ? parseInt(classId) : undefined,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countStudents(
        includeInactive === "true",
        classId ? parseInt(classId) : undefined
      );

      return ctx.json({
        success: true,
        data: students,
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

  async createStudent(ctx) {
    try {
      const formData = await ctx.req.parseBody();
      this.validator.validateCreate(formData);

      if (formData.classId) {
        formData.classId = parseInt(formData.classId);
      }

      const newStudent = await this.service.createStudent(formData);
      return ctx.json({ success: true, data: newStudent }, 201);
    } catch (error) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateStudent(ctx) {
    try {
      const studentId = parseInt(ctx.req.param("id"));
      if (isNaN(studentId)) throw new Error("ID invalide");

      const formData = await ctx.req.parseBody();
      if (formData.classId) {
        formData.classId = parseInt(formData.classId);
      }
      this.validator.validateUpdate(formData);

      const updatedStudent = await this.service.updateStudent(
        studentId,
        formData
      );
      return ctx.json({ success: true, data: updatedStudent });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async getStudent(ctx) {
    try {
      const studentId = parseInt(ctx.req.param("id"));
      if (isNaN(studentId)) throw new Error("ID invalide");

      const student = await this.service.getStudentById(studentId);
      if (!student) throw new Error("Élève non trouvé");

      return ctx.json({ success: true, data: student });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const studentId = parseInt(ctx.req.param("id"));
      if (isNaN(studentId)) throw new Error("ID invalide");

      const result = await this.service.setStudentStatus(studentId, action);
      return ctx.json({
        success: true,
        message: `Élève ${
          action === "restore" ? "réactivé" : "désactivé"
        } avec succès`,
        data: result,
      });
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      throw new HTTPException(statusCode, { message: error.message });
    }
  }

  async deleteStudent(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreStudent(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }

  async getStats(ctx) {
    try {
      const { classId } = ctx.req.query();
      const stats = await this.service.getStats(
        classId ? parseInt(classId) : undefined
      );
      return ctx.json({ success: true, data: stats });
    } catch (error) {
      throw new HTTPException(500, { message: error.message });
    }
  }
}