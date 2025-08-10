import { Hono } from "hono";
import AnneeScolaireController from "../controllers/AnneeScolaireController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class AnneeScolaireRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new AnneeScolaireController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.get("/", (ctx) => this.controller.getAllAnnees(ctx));
    this.router.get("/active", (ctx) => this.controller.getActiveAnnee(ctx));
    this.router.get("/:id", (ctx) => this.controller.getAnnee(ctx));
    this.router.post("/", (ctx) => this.controller.createAnnee(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateAnnee(ctx));
    this.router.patch("/:id/delete", (ctx) => this.controller.deleteAnnee(ctx));
    this.router.patch("/:id/restore", (ctx) =>this.controller.restoreAnnee(ctx));
  }

  get routes() {
    return this.router;
  }
}
