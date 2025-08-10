import { z } from "zod";

export default class AnneeScolaireSchema {
    constructor(){
        this.regex = /^\d{4}-\d{4}$/;
    }
  validateCreate(data) {
    const schema = z.object({
      libelle: z
        .string()
        .regex(this.regex, "Format invalide (ex: 2023-2024)"),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }

  validateUpdate(data) {
    const schema = z.object({
      libelle: z.string().regex(this.regex).optional()
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}
