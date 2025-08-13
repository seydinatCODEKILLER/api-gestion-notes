import { Hono } from "hono";
import TrimestreController from "../controllers/TrimestreController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class TrimestreRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new TrimestreController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {

    // Routes publiques
    this.router.get("/", (ctx) => this.controller.getAllTrimestres(ctx));
    this.router.get("/current", (ctx) =>this.controller.getCurrentTrimestre(ctx));
    this.router.get("/:id", (ctx) => this.controller.getTrimestre(ctx));

    // Routes protégées admin
    this.router.post("/", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.createTrimestre(ctx));
    this.router.put("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.updateTrimestre(ctx));
    this.router.patch("/:id/delete", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.deleteTrimestre(ctx));
    this.router.patch("/:id/restore", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.restoreTrimestre(ctx));
  }

  get routes() {
    return this.router;
  }
}
