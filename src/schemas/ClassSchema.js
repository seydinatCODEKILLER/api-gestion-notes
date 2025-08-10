import { z } from "zod";

export default class ClassSchema {
  validateCreate(data) {
    const schema = z.object({
      nom: z.string().min(2).max(50),
      niveauId: z.number().int().positive(),
      anneeScolaireId: z.number().int().positive(),
      capacite_max: z.number().int().positive().optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }

  validateUpdate(data) {
    const schema = z.object({
      nom: z.string().min(2).max(50).optional(),
      niveauId: z.number().int().positive().optional(),
      anneeScolaireId: z.number().int().positive().optional(),
      capacite_max: z.number().int().positive().optional().nullable(),
      statut: z.enum(["actif", "inactif"]).optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}