import { HTTPException } from "hono/http-exception";
import AverageService from "../services/AverageService.js";
import AverageSchema from "../schemas/AverageSchema.js";
import { prisma } from "../config/database.js";

export default class AverageController {
  constructor() {
    this.service = new AverageService();
    this.validator = new AverageSchema();
  }

  async createOrUpdateAverage(ctx) {
    try {
      const data = await ctx.req.json();
      console.log(data)
      const dt = {
        studentId: parseInt(data.studentId),
        subjectId: parseInt(data.subjectId),
        trimestreId: parseInt(data.trimestreId)
      }
      const validatedData = this.validator.validateCreate(dt);
      
      const result = await this.service.createOrUpdateAverage(validatedData);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getStudentAverages(ctx) {
    try {
      const studentId = parseInt(ctx.req.param("studentId"));
      const filters = {
        subjectId: ctx.req.query("subjectId") ? parseInt(ctx.req.query("subjectId")) : undefined,
        trimestreId: ctx.req.query("trimestreId") ? parseInt(ctx.req.query("trimestreId")) : undefined,
        anneeScolaireId: ctx.req.query("anneeScolaireId") ? parseInt(ctx.req.query("anneeScolaireId")) : undefined
      };

      const result = await this.service.getAveragesByStudent(studentId, filters);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async getClassAverages(ctx) {
    try {
      const classId = parseInt(ctx.req.param("classId"));
      const filters = {
        subjectId: ctx.req.query("subjectId") ? parseInt(ctx.req.query("subjectId")) : undefined,
        trimestreId: ctx.req.query("trimestreId") ? parseInt(ctx.req.query("trimestreId")) : undefined,
        anneeScolaireId: ctx.req.query("anneeScolaireId") ? parseInt(ctx.req.query("anneeScolaireId")) : undefined
      };

      const teacherId = ctx.get('user')?.role === 'professeur' 
        ? await this._getTeacherId(ctx.get('user').id)
        : null;

      const result = await this.service.getAveragesByClass(classId, filters, teacherId);
      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async calculateClassAverages(ctx) {
    try {
      const classId = parseInt(ctx.req.param("classId"));
      const trimestreId = parseInt(ctx.req.query("trimestreId"));
      const forceFull = ctx.req.query("force") === "true";
      
      if (!trimestreId) throw new Error("Le paramètre trimestreId est requis");

      let result;
      if (forceFull) {
        result = await this.service.calculateClassAverages(classId, trimestreId);
      } else {
        const updatedStudents = await prisma.gradeUpdateTrack.findMany({
          where: { trimestreId },
          distinct: ['studentId'],
          select: { studentId: true }
        });
        console.log("Élèves avec notes modifiées:", updatedStudents);
        
        result = await this.service.calculateUpdatedAverages(
          classId, 
          trimestreId,
          updatedStudents.map(s => s.studentId)
        );
        
        await prisma.gradeUpdateTrack.deleteMany({
          where: { trimestreId }
        });
      }

      return ctx.json({ 
        success: true, 
        data: result,
        metadata: {
          calculatedAt: new Date().toISOString(),
          strategy: forceFull ? "full_recalculation" : "incremental_update"
        }
      });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  async _getTeacherId(userId) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { id: true }
    });
    return teacher?.id;
  }

  _getErrorStatus(error) {
    if (error.message.includes("introuvable")) return 404;
    if (error.message.includes("existe déjà")) return 409;
    return 400;
  }
};