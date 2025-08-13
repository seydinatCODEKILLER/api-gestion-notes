import { z } from "zod";

export default class TrimestreSchema {
  validateCreate(data) {
    const schema = z.object({
      libelle: z.string().min(2).max(10),
      anneeScolaireId: z.number().int().positive(),
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
        libelle: z.string().min(2).max(10).optional(),
        anneeScolaireId: z.number().int().positive().optional(),
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
