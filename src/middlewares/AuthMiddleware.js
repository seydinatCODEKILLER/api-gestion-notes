import { HTTPException } from "hono/http-exception";
import TokenGenerator from "../config/jwt.js";

export default class AuthMiddleware {
  constructor() {
    this.tokenGenerator = new TokenGenerator();
  }

  protect(roles = []) {
    return async (ctx, next) => {
      const authHeader = ctx.req.header("authorization");

      if (!authHeader?.startsWith("Bearer ")) {
        throw new HTTPException(401, { message: "Authentification requise" });
      }

      try {
        const token = authHeader.split(" ")[1];
        const decoded = this.tokenGenerator.verify(token);

        if (roles.length && !roles.includes(decoded.role)) {
          throw new HTTPException(403, {
            message: "Permissions insuffisantes",
          });
        }

        ctx.set("user", decoded);
        await next();
      } catch (error) {
        throw new HTTPException(401, { message: "Token invalide ou expiré" });
      }
    };
  }
}
