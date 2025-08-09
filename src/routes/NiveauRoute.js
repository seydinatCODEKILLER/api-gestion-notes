import { Hono } from "hono";
import NiveauController from "../controllers/NiveauController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class NiveauRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new NiveauController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.get("/", (ctx) => this.controller.getAllNiveaux(ctx));
    this.router.get("/:id", (ctx) => this.controller.getNiveau(ctx));
    this.router.post("/", (ctx) => this.controller.createNiveau(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateNiveau(ctx));
    this.router.patch("/:id/delete", (ctx) =>this.controller.deleteNiveau(ctx));
    this.router.patch("/:id/restore", (ctx) =>this.controller.restoreNiveau(ctx));
  }

  get routes() {
    return this.router;
  }
}
