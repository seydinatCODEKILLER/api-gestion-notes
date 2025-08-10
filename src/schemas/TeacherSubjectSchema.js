import { z } from "zod";

export default class TeacherSubjectSchema {
  validateCreate(data) {
    const schema = z.object({
      teacherId: z.number().int().positive(),
      subjectId: z.number().int().positive(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}
