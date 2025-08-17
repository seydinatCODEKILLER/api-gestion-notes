import { Hono } from "hono";
import ExportNotesController from "../controllers/ExportNotesController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import OwnershipMiddleware from "../middlewares/OwnershipMiddleware.js";

export default class ExportNotesRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ExportNotesController();
    this.authMiddleware = new AuthMiddleware();
    this.ownershipMiddleware = new OwnershipMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get(
      "/grades",
      this.authMiddleware.protect(["professeur", "admin"]),
      (ctx, next) => this.ownershipMiddleware.checkTeacherSubjectAccess(ctx, next),
      (ctx) => this.controller.exportGrades(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
