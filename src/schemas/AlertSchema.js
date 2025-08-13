import { z } from "zod";

export default class AlertSchema {
  validateCreate(data) {
    const schema = z.object({
      studentId: z.number().int().positive(),
      type: z.enum(["note_basse", "absentéisme", "comportement"]),
      subjectId: z.number().int().positive().optional(),
      trimestre: z.number().int().min(1).max(3),
      message: z.string().min(10).max(1000),
      priorite: z.enum(["faible", "moyenne", "haute"]).default("moyenne"),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
    return result.data;
  }

  validateUpdate(data) {
    const schema = z
      .object({
        statut: z.enum(["nouveau", "en_cours", "resolu"]).optional(),
        priorite: z.enum(["faible", "moyenne", "haute"]).optional(),
        message: z.string().min(10).max(1000).optional(),
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: "Au moins un champ doit être fourni pour la mise à jour",
      });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
    return result.data;
  }
}
