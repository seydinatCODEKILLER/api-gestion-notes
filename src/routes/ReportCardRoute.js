import { Hono } from "hono";
import ReportCardController from "../controllers/ReportCardController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import OwnershipMiddleware from "../middlewares/OwnershipMiddleware.js";

export default class ReportCardRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ReportCardController();
    this.authMiddleware = new AuthMiddleware();
    this.ownershipMiddleware = new OwnershipMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    // Génération et mise à jour (Admin seulement)
    this.router.post("/", this.authMiddleware.protect(["admin"]), (ctx) =>
      this.controller.generateReportCard(ctx)
    );

    this.router.put("/:id", this.authMiddleware.protect(["admin"]), (ctx) =>
      this.controller.updateReportCard(ctx)
    );

    // Consultation
    this.router.get(
      "/student/:studentId",
      this.authMiddleware.protect(["admin", "professeur", "eleve"]),
      (ctx, next) => this.ownershipMiddleware.checkStudentAccess(ctx, next),
      (ctx) => this.controller.getStudentReportCards(ctx)
    );

    this.router.get(
      "/class/:classId",
      this.authMiddleware.protect(["admin", "professeur"]),
      (ctx, next) =>
        this.ownershipMiddleware.checkTeacherClassAccess(ctx, next),
      (ctx) => this.controller.getClassReportCards(ctx)
    );

    this.router.get(
      "/download/:id",
      this.authMiddleware.protect(["admin", "professeur", "eleve"]),
      (ctx, next) => this.ownershipMiddleware.checkReportCardAccess(ctx, next),
      (ctx) => this.controller.downloadReportCard(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
