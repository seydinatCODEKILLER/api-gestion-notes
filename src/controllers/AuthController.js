import AuthService from "../services/AuthService.js";
import AuthSchema from "../schemas/AuthSchema.js";

export default class AuthController {
  constructor() {
    this.service = new AuthService();
    this.validator = new AuthSchema();
  }

  async login(ctx) {
    try {
      const credentials = await ctx.req.json();
      this.validator.validateLogin(credentials);
      const result = await this.service.login(
        credentials.email,
        credentials.password
      );
      return ctx.success(result, "Connexion réussie");
    } catch (error) {
      return ctx.error(error.message, error.status || 400);
    }
  }

  async refreshToken(ctx) {
    try {
      const { refreshToken } = await ctx.req.json();
      const result = await this.service.refreshToken(refreshToken);
      return ctx.success(result, "Token rafraîchi");
    } catch (error) {
      return ctx.error(error.message, error.status || 400);
    }
  }

  async getCurrentUser(ctx) {
    try {
      const authHeader = ctx.req.header("Authorization");
      if (!authHeader) return ctx.error("Token requis", 401);

      const token = authHeader.split(" ")[1];
      const user = await this.service.getCurrentUser(token);
      return ctx.success({ user }, "Utilisateur récupéré");
    } catch (error) {
      return ctx.error(error.message, error.status || 401);
    }
  }
}
