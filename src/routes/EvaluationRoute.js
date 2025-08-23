import { Hono } from "hono";
import EvaluationController from "../controllers/EvaluationController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class EvaluationRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new EvaluationController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get(
      "/",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.getAllEvaluations(ctx)
    );

    this.router.get(
      "/class/:classId",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.getEvaluationsByClass(ctx)
    );

    this.router.get(
      "/teacher/:teacherId",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.getEvaluationsByTeacher(ctx)
    );

    this.router.get(
      "/:id",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.getEvaluation(ctx)
    );

    this.router.get(
      "/:id/stats",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.getEvaluationStats(ctx)
    );

    this.router.post(
      "/",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.createEvaluation(ctx)
    );

    this.router.put(
      "/:id",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.updateEvaluation(ctx)
    );

    this.router.delete(
      "/:id",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.deleteEvaluation(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
