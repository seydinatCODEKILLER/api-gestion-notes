import { Hono } from "hono";
import SubjectController from "../controllers/SubjectController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class SubjectRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new SubjectController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.get("/", (ctx) => this.controller.getAllSubjects(ctx));
    this.router.get("/:id", (ctx) => this.controller.getSubject(ctx));
    this.router.post("/", (ctx) => this.controller.createSubject(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateSubject(ctx));
    this.router.patch("/:id/delete", (ctx) =>this.controller.deleteSubject(ctx));
    this.router.patch("/:id/restore", (ctx) =>this.controller.restoreSubject(ctx));
  }

  get routes() {
    return this.router;
  }
}
