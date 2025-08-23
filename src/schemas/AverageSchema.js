import { z } from "zod";

export default class AverageSchema {
  validateCreate(data) {
    const schema = z.object({
      studentId: z.number().int().positive(),
      subjectId: z.number().int().positive(),
      trimestreId: z.number().int().positive(),
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
        studentId: z.number().int().positive(),
        subjectId: z.number().int().positive(),
        trimestreId: z.number().int().positive(),
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
};