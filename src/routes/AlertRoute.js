import { Hono } from "hono";
import AlertController from "../controllers/AlertController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import OwnershipMiddleware from "../middlewares/OwnershipMiddleware.js";

export default class AlertRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new AlertController();
    this.authMiddleware = new AuthMiddleware();
    this.ownershipMiddleware = new OwnershipMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get(
      "/",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.getAllAlerts(ctx)
    );

    this.router.get(
      "/stats",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx) => this.controller.getAlertsStats(ctx)
    );

    // Création d'alerte (professeurs seulement)
    this.router.post(
      "/",
      this.authMiddleware.protect(["professeur"]),
      (ctx, next) =>
        this.ownershipMiddleware.checkTeacherSubjectAccess(ctx, next),
      (ctx) => this.controller.createAlert(ctx)
    );

    // Consultation individuelle
    this.router.get(
      "/:id",
      this.authMiddleware.protect(["admin", "professeur", "eleve"]),
      (ctx, next) => this.ownershipMiddleware.checkAlertAccess(ctx, next),
      (ctx) => this.controller.getAlert(ctx)
    );

    // Mise à jour (admin et professeurs concernés)
    this.router.put(
      "/:id",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx, next) => this.ownershipMiddleware.checkAlertAccess(ctx, next),
      (ctx) => this.controller.updateAlert(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
