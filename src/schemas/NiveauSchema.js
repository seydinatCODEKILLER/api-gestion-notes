import { z } from "zod";

export default class NiveauSchema {
  validateCreate(data) {
    const schema = z.object({
      libelle: z.string().min(2, "Libellé trop court"),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }

  validateUpdate(data) {
    const schema = z.object({
      libelle: z.string().min(2).optional(),
      statut: z.enum(["actif", "inactif"]).optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}
