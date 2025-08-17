import { HTTPException } from "hono/http-exception";
import StatistiqueService from "../services/StatistiqueService.js";

export default class StatistiqueController {
  constructor() {
    this.service = new StatistiqueService();
  }

  async getGlobalStatistics(ctx) {
    try {
      const anneeScolaireId = parseInt(ctx.req.query("anneeScolaireId"));
      const trimestreId = parseInt(ctx.req.query("trimestreId"));

      if (!trimestreId) throw new Error("Le paramètre trimestreId est requis");
      if (!anneeScolaireId) throw new Error("Le paramètre trimestreId est requis");

      if(isNaN(anneeScolaireId)) throw new Error("l'id recuperer n'est pas bonne")
      if (isNaN(trimestreId)) throw new Error("l'id recuperer n'est pas bonne");

      

      const result = await this.service.getGlobalStatistics(
        anneeScolaireId,
        trimestreId
      );

      return ctx.json({ success: true, data: result });
    } catch (error) {
      const status = this._getErrorStatus(error);
      throw new HTTPException(status, { message: error.message });
    }
  }

  _getErrorStatus(error) {
    if (error.message.includes("introuvable")) return 404;
    if (
      error.message.includes("autorisé") ||
      error.message.includes("autorisée")
    )
      return 403;
    return 400;
  }
}
