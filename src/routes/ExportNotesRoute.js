import { Hono } from "hono";
import ExportNotesController from "../controllers/ExportNotesController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class ExportNotesRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ExportNotesController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get(
      "/grades",
      this.authMiddleware.protect(["professeur", "admin"]),
      (ctx) => this.controller.exportGrades(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
