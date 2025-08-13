import { z } from "zod";

export default class ReportCardSchema {
  validateCreate(data) {
    const schema = z.object({
      studentId: z.number().int().positive(),
      trimestreId: z.number().int().positive(),
      moyenne_generale: z.number()
        .min(0)
        .max(20)
        .transform(val => parseFloat(val.toFixed(2))),
      rang_classe: z.number().int().min(1).optional(),
      appreciation_generale: z.string().max(1000).optional(),
      chemin_fichier: z.string().url()
    }).refine(data => data.moyenne_generale <= 20, {
      message: "La moyenne générale ne peut pas dépasser 20",
      path: ["moyenne_generale"]
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
    return result.data;
  }

  validateUpdate(data) {
    const schema = z.object({
      moyenne_generale: z.number()
        .min(0)
        .max(20)
        .transform(val => parseFloat(val.toFixed(2)))
        .optional(),
      rang_classe: z.number().int().min(1).optional(),
      appreciation_generale: z.string().max(1000).optional(),
      chemin_fichier: z.string().url().optional()
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