import { z } from "zod"

export default class AuthSchema {
  constructor() {}

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