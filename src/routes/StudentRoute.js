import { Hono } from "hono";
import StudentController from "../controllers/StudentController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class StudentRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new StudentController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.get("/", (ctx) => this.controller.getAllStudents(ctx));
    this.router.get("/stats", (ctx) => this.controller.getStats(ctx));
    this.router.get("/:id", (ctx) => this.controller.getStudent(ctx));
    this.router.post("/", (ctx) => this.controller.createStudent(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateStudent(ctx));
    this.router.patch("/:id/delete", (ctx) => this.controller.deleteStudent(ctx));
    this.router.patch("/:id/restore", (ctx) =>this.controller.restoreStudent(ctx));
  }

  get routes() {
    return this.router;
  }
}
