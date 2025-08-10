import { Hono } from "hono";
import ClassSubjectController from "../controllers/ClassSubjectController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class ClassSubjectRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ClassSubjectController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.post("/", (ctx) => this.controller.assignSubject(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateAssignment(ctx));
    this.router.get("/class/:classId/:anneeScolaireId", (ctx) =>
      this.controller.getClassSubjects(ctx)
    );
    this.router.delete("/:id", (ctx) => this.controller.removeAssignment(ctx));
  }

  get routes() {
    return this.router;
  }
}