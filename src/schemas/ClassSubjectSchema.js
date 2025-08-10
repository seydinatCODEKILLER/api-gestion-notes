import { z } from "zod";

export default class ClassSubjectSchema {
  validateCreate(data) {
    const schema = z.object({
      classId: z.number().int().positive(),
      subjectId: z.number().int().positive(),
      teacherId: z.number().int().positive().optional(),
      anneeScolaireId: z.number().int().positive()
    });
    this._validate(schema, data);
  }

  validateUpdate(data) {
    const schema = z.object({
      teacherId: z.number().int().positive().optional().nullable()
    }).refine(data => Object.keys(data).length > 0, {
      message: "Au moins un champ doit être fourni"
    });
    this._validate(schema, data);
  }

  _validate(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}