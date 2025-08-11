import { z } from "zod";

export default class StudentSchema {
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

      date_naissance: z.coerce.date().refine((date) => date < new Date(), {
        message: "La date de naissance doit être dans le passé",
      }),
      lieu_naissance: z.string().optional(),

      nom_parent: z.string().min(2),
      telephone_parent: z.string().regex(this.phoneRegex),
      email_parent: z.string().email().optional(),

      classId: z.preprocess(
        (val) => (val ? parseInt(val) : undefined),
        z.number().int().positive().optional()
      ),

      avatar: z
        .union([z.instanceof(File), z.instanceof(Buffer), z.string().url()])
        .optional(),
    });

    return this._validate(schema, data);
  }

  validateUpdate(data) {
    const schema = z
      .object({
        nom: z.string().min(2).optional(),
        prenom: z.string().min(2).optional(),
        email: z.string().email().optional(),
        telephone: z.string().regex(this.phoneRegex).optional(),
        adresse: z.string().optional(),
        date_naissance: z
          .string()
          .refine((val) => !isNaN(Date.parse(val)))
          .optional(),
        lieu_naissance: z.string().optional(),
        nom_parent: z.string().min(2).optional(),
        telephone_parent: z.string().regex(this.phoneRegex).optional(),
        email_parent: z.string().email().optional(),
        classId: z.number().int().positive().nullable().optional(),
        avatar: z
          .union([z.instanceof(File), z.instanceof(Buffer), z.string().url()])
          .optional(),
        currentPassword: z.string().min(6).optional(),
        newPassword: z.string().min(6).optional(),
      })
      .refine(
        (data) => {
          if (data.newPassword && !data.currentPassword) return false;
          return true;
        },
        {
          message:
            "Le mot de passe actuel est requis pour changer le mot de passe",
          path: ["currentPassword"],
        }
      );

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }

  _validate(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}
