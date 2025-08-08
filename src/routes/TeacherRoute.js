import { Hono } from "hono";
import TeacherController from "../controllers/TeacherController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class TeacherRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new TeacherController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.get("/", (ctx) => this.controller.getAllTeachers(ctx));
    this.router.post("/", async (ctx) => this.controller.createTeacher(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateTeacher(ctx));

  }

  get routes() {
    return this.router;
  }
}
