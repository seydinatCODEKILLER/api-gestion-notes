import { z } from "zod";

export default class TeacherSchema {
  constructor() {
    this.phoneRegex = /^\+?[0-9]{6,14}$/;
  }

    validateCreate(data) {
    const schema = z.object({
      nom: z.string().min(2),
      prenom: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      telephone: z.string().regex(this.phoneRegex),
      adresse: z.string().optional(),
      specialite: z.string().min(2),
      date_embauche: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Date invalide",
      }),
      avatar: z.instanceof(File).optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }

  validateUpdate(data) {
  const schema = z.object({
    nom: z.string().min(2).optional(),
    prenom: z.string().min(2).optional(),
    email: z.string().email().optional(),
    telephone: z.string().regex(this.phoneRegex).optional(),
    adresse: z.string().optional(),
    specialite: z.string().min(2).optional(),
    avatar: z.instanceof(File).optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional()
  }).refine(data => {
    if (data.newPassword && !data.currentPassword) return false;
    return true;
  }, {
    message: "Le mot de passe actuel est requis pour changer le mot de passe",
    path: ["currentPassword"]
  });

  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
  }
}
}
