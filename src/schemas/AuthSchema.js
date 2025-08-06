import { z } from "zod"

export default class AuthSchema {
  constructor() {
    this.phoneRegex = /^\+?[0-9]{6,14}$/
  }

  validateRegister(data) {
    const schema = z.object({
      nom: z.string().min(2).max(100),
      prenom: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(6),
      telephone: z.string().regex(this.phoneRegex),
      role: z.enum(["admin", "professeur", "eleve"]),
      adresse: z.string().optional(),
      avatar: z.instanceof(File).optional()
    })

    const result = schema.safeParse(data)
    if (!result.success) {
      throw new Error(result.error.flatten().fieldErrors)
    }
  }

  validateLogin(data) {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    })

    const result = schema.safeParse(data)
    if (!result.success) {
      throw new Error(result.error.flatten().fieldErrors)
    }
  }
}