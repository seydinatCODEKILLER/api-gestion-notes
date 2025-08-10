import { z } from "zod";

export default class SubjectSchema {
  validateCreate(data) {
    const schema = z.object({
      nom: z.string().min(2).max(100),
      niveauId: z.number().int().positive(),
      coefficient: z.number().min(0.1).max(10),
      description: z.string().max(500).optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }

  validateUpdate(data) {
    const schema = z.object({
      nom: z.string().min(2).max(100).optional(),
      niveauId: z.number().int().positive().optional(),
      coefficient: z.number().min(0.1).max(10).optional(),
      description: z.string().max(500).optional().nullable(),
      statut: z.enum(["actif", "inactif"]).optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}
