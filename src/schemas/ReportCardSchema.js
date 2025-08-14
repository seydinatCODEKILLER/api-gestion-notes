import { z } from "zod";

export default class ReportCardSchema {
  validateCreate(data) {
    const schema = z.object({
      studentId: z.number().int().positive(),
      trimestreId: z.number().int().positive(),
      rang_classe: z.number().int().min(1).optional(),
      appreciation_generale: z.string().max(1000).optional(),
      chemin_fichier: z.string().optional(),
      file_path: z.string().optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
    return result.data;
  }

  validateUpdate(data) {
    const schema = z.object({
      rang_classe: z.number().int().min(1).optional(),
      appreciation_generale: z.string().max(1000).optional(),
      chemin_fichier: z.string().url().optional()
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
    return result.data;
  }
};