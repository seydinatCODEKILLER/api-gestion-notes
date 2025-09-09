import { Hono } from "hono";
import AuthController from "../controllers/AuthController.js";
import responseHandler from "../middlewares/responseMiddleware.js";

export default class AuthRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new AuthController();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use('*', responseHandler);
    this.router.post("/login", (ctx) => this.controller.login(ctx));
    this.router.post("/refreshToken", (ctx) => this.controller.refreshToken(ctx));
    this.router.get("/me", (ctx) => this.controller.getCurrentUser(ctx));
  }

  get routes() {
    return this.router;
  }
}