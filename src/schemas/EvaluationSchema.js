import { z } from "zod";

export default class EvaluationSchema {
  validateCreate(data) {
    const schema = z.object({
      classId: z.number().int().positive(),
      subjectId: z.number().int().positive(),
      teacherId: z.number().int().positive(),
      type: z.enum(["devoir", "composition", "oral", "projet"]),
      titre: z.string().min(2).max(100),
      date_evaluation: z.string().datetime(),
      anneeScolaireId: z.number().int().positive(),
      trimestreId: z.number().int().positive(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }

  validateUpdate(data) {
    const schema = z.object({
      type: z.enum(["devoir", "composition", "oral", "projet"]).optional(),
      titre: z.string().min(2).max(100).optional(),
      date_evaluation: z.string().datetime().optional(),
      trimestreId: z.number().int().positive().optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}
