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
    this.router.post("/", (ctx) => this.controller.assignSubject(ctx));
    this.router.get("/teacher/:teacherId",this.authMiddleware.protect(["admin","professeur"]), (ctx) =>this.controller.getTeacherSubjects(ctx));
    this.router.get(
      "/teacherClass/:teacherId",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.getTeacherSubjectsForTeacher(ctx)
    );
    this.router.delete("/:id",this.authMiddleware.protect(["admin"]), (ctx) =>this.controller.removeAssignment(ctx));
    this.router.get("/",this.authMiddleware.protect(["admin"]), (ctx) => this.controller.getAllAssociations(ctx));
    this.router.get("/:id", this.authMiddleware.protect(["admin"]),(ctx) => this.controller.getAssociation(ctx));
  }

  get routes() {
    return this.router;
  }
}
