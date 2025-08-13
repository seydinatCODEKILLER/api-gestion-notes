import { z } from "zod";

export default class AverageSchema {
  validateCreate(data) {
    const schema = z.object({
      studentId: z.number().int().positive(),
      subjectId: z.number().int().positive(),
      trimestreId: z.number().int().positive(),
      anneeScolaireId: z.number().int().positive(),
      moyenne: z.number()
        .min(0)
        .max(20)
        .transform(val => parseFloat(val.toFixed(2))),
      rang: z.number().int().min(1).optional(),
      appreciation: z.string().max(500).optional()
    }).refine(data => data.moyenne <= 20, {
      message: "La moyenne ne peut pas dépasser 20",
      path: ["moyenne"]
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
    return result.data;
  }

  validateUpdate(data) {
    const schema = z.object({
      moyenne: z.number()
        .min(0)
        .max(20)
        .transform(val => parseFloat(val.toFixed(2)))
        .optional(),
      rang: z.number().int().min(1).optional(),
      appreciation: z.string().max(500).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: "Au moins un champ doit être fourni pour la mise à jour"
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
    return result.data;
  }
};