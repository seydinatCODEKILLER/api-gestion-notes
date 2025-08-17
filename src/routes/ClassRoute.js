import { Hono } from "hono";
import ClassController from "../controllers/ClassController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class ClassRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ClassController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get("/", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.getAllClasses(ctx));
    this.router.get("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.getClass(ctx));
    this.router.post("/", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.createClass(ctx));
    this.router.put("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.updateClass(ctx));
    this.router.patch("/:id/delete", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.deleteClass(ctx));
    this.router.patch("/:id/restore", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.restoreClass(ctx));
    this.router.get("/teacher/:teacherId", this.authMiddleware.protect(["admin","professeur"]), (ctx) => this.controller.getClassesByTeacher(ctx));
  }

  get routes() {
    return this.router;
  }
}
