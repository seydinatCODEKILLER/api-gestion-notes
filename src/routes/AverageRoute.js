import { Hono } from "hono";
import AverageController from "../controllers/AverageController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import OwnershipMiddleware from "../middlewares/OwnershipMiddleware.js";

export default class AverageRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new AverageController();
    this.authMiddleware = new AuthMiddleware();
    this.ownershipMiddleware = new OwnershipMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    // Création/Mise à jour
    this.router.post(
      "/",
      this.authMiddleware.protect(["admin", "professeur"]),
      this.ownershipMiddleware.checkTeacherSubjectAccess,
      (ctx) => this.controller.createOrUpdateAverage(ctx)
    );

    // Calcul des moyennes
    this.router.post(
      "/calculate/:classId",
      this.authMiddleware.protect(["admin", "professeur"]),
      this.ownershipMiddleware.checkTeacherClassAccess,
      (ctx) => this.controller.calculateClassAverages(ctx)
    );

    // Consultation
    this.router.get(
      "/student/:studentId",
      this.authMiddleware.protect(["admin", "professeur", "eleve"]),
      this.ownershipMiddleware.checkStudentAccess,
      (ctx) => this.controller.getStudentAverages(ctx)
    );

    this.router.get(
      "/class/:classId",
      this.authMiddleware.protect(["admin", "professeur"]),
      this.ownershipMiddleware.checkTeacherClassAccess,
      (ctx) => this.controller.getClassAverages(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
