import { z } from "zod";

export default class TeacherSchema {
  constructor() {
    this.phoneRegex = /^\+?[0-9]{6,14}$/;
  }

  validateCreate(data) {
    const schema = z.object({
      nom: z.string().min(2).max(100),
      prenom: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(6),
      telephone: z.string().regex(this.phoneRegex),
      adresse: z.string().optional(),
      avatar: z.string().optional(),
      specialite: z.string().min(2),
      date_embauche: z.string().optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}
