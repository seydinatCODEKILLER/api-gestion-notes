import ExportNotesService from "../services/ExportNotesService.js";
import { HTTPException } from "hono/http-exception";
import fs from "fs/promises";


export default class ExportNotesController {
  constructor() {
    this.service = new ExportNotesService();
  }

  async exportGrades(ctx) {
    try {
      const { classId, subjectId, trimestreId } = ctx.req.query();
      
      if (!classId || !subjectId) {
        throw new Error("Les paramètres classId et subjectId sont obligatoires");
      }

      const { filePath, publicUrl, filename } = await this.service.generateGradesPDF({
        classId: Number(classId),
        subjectId: Number(subjectId),
        trimestreId: trimestreId ? Number(trimestreId) : undefined,
      });

      // Retourner le fichier PDF directement
      const pdfBuffer = await fs.readFile(filePath);

      // Retourne le PDF en réponse
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });

    } catch (error) {
      throw new HTTPException(400, { 
        message: error.message || "Erreur lors de l'export des notes" 
      });
    }
  }
}