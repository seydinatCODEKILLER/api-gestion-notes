import { Hono } from "hono";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import StatistiqueController from "../controllers/StatistiqueController.js";

export default class StatistiqueRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new StatistiqueController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get(
      "/global",
      this.authMiddleware.protect(["admin"]),
      (ctx) => this.controller.getGlobalStatistics(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
