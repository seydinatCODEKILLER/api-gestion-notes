import { Hono } from "hono";
import GradeController from "../controllers/GradeController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class GradeRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new GradeController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", this.authMiddleware.protect(["professeur"]), (ctx) => this.controller.createGrade(ctx));
    this.router.put("/:id", this.authMiddleware.protect(["professeur"]),(ctx) => this.controller.updateGrade(ctx));
    this.router.delete("/:id", this.authMiddleware.protect(["professeur"]),(ctx) => this.controller.deleteGrade(ctx));
    this.router.get("/student/:studentId", this.authMiddleware.protect(["professeur", "admin", "eleve"]),(ctx) => this.controller.getStudentGrades(ctx));
    this.router.get("/class/:classId", this.authMiddleware.protect(["professeur", "admin"]),(ctx) => this.controller.getClassGrades(ctx));
  }

  get routes() {
    return this.router;
  }
}
