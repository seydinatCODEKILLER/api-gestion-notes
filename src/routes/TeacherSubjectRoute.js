import { Hono } from "hono";
import TeacherSubjectController from "../controllers/TeacherSubjectController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class TeacherSubjectRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new TeacherSubjectController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.post("/", (ctx) => this.controller.assignSubject(ctx));
    this.router.get("/teacher/:teacherId", (ctx) =>this.controller.getTeacherSubjects(ctx));
    this.router.delete("/:id", (ctx) =>this.controller.removeAssignment(ctx));
    this.router.get("/", (ctx) => this.controller.getAllAssociations(ctx));
    this.router.get("/:id", (ctx) => this.controller.getAssociation(ctx));
  }

  get routes() {
    return this.router;
  }
}
