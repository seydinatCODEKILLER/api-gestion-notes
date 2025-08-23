import { z } from "zod";

export default class GradeSchema {
  validateCreate(data) {
    const schema = z.object({
      studentId: z.number().int().positive(),
      subjectId: z.number().int().positive(),
      trimestreId: z.number().int().positive(),
      anneeScolaireId: z.number().int().positive(),
      note: z.number().min(0).max(20),
      type_note: z.enum(['devoir', 'composition', 'oral', 'projet']),
    }).refine(data => data.note <= 20, {
      message: "La note ne peut pas dépasser 20",
      path: ["note"]
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }

  validateUpdate(data) {
    const schema = z.object({
      note: z.number().min(0).max(20).optional(),
      type_note: z.enum(['devoir', 'composition', 'oral', 'projet']).optional(),
    }).refine(data => Object.keys(data).length > 0, {
      message: "Au moins un champ doit être fourni pour la mise à jour"
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}