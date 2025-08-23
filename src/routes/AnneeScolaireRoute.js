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
    this.router.get("/",this.authMiddleware.protect(["admin","professeur"]), (ctx) => this.controller.getAllAnnees(ctx));
    this.router.get("/active",this.authMiddleware.protect(["admin","professeur"]), (ctx) => this.controller.getActiveAnnee(ctx));
    this.router.get("/:id",this.authMiddleware.protect(["admin"]), (ctx) => this.controller.getAnnee(ctx));
    this.router.post("/",this.authMiddleware.protect(["admin"]), (ctx) => this.controller.createAnnee(ctx));
    this.router.put("/:id",this.authMiddleware.protect(["admin"]), (ctx) => this.controller.updateAnnee(ctx));
    this.router.patch("/:id/delete",this.authMiddleware.protect(["admin"]), (ctx) => this.controller.deleteAnnee(ctx));
    this.router.patch("/:id/restore",this.authMiddleware.protect(["admin"]), (ctx) =>this.controller.restoreAnnee(ctx));
  }

  get routes() {
    return this.router;
  }
}
