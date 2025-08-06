import { HTTPException } from 'hono/http-exception'
import AuthService from '../services/AuthService.js'
import AuthSchema from '../schemas/AuthSchema.js'

export default class AuthController {
  constructor() {
    this.service = new AuthService()
    this.validator = new AuthSchema();
  }

  async register(ctx) {
    try {
      const formData = await ctx.req.parseBody()
      this.validator.validateRegister(formData)

      const user = await this.service.register(formData)
      return ctx.json({ success: true, data: user }, 201)
    } catch (error) {
      throw new HTTPException(400, { message: error.message })
    }
  }

  async login(ctx) {
    try {
      const credentials = await ctx.req.json()
      this.validator.validateLogin(credentials)

      const result = await this.service.login(credentials.email, credentials.password)
      return ctx.json({ success: true, data: result })
    } catch (error) {
      throw new HTTPException(401, { message: error.message })
    }
  }
}