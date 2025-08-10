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
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.get("/", (ctx) => this.controller.getAllClasses(ctx));
    this.router.get("/:id", (ctx) => this.controller.getClass(ctx));
    this.router.post("/", (ctx) => this.controller.createClass(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateClass(ctx));
    this.router.patch("/:id/delete", (ctx) => this.controller.deleteClass(ctx));
    this.router.patch("/:id/restore", (ctx) =>
      this.controller.restoreClass(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
