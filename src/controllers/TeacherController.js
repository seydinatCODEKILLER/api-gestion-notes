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
      const teachers = await this.service.getAllTeachers();
      if (teachers.length === 0) return ctx.json({ success: true, message: "Aucun professeur trouvé", data: [] },200);
      return ctx.json({ success: true, data: teachers });
    } catch (error) {
      throw new HTTPException(500, { message: error.message });
    }
  }
}
