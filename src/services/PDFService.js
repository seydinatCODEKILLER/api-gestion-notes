// src/services/PDFService.js
import PDFDocument from "pdfkit";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class PDFService {
  constructor() {
    this.publicFolder = path.join(__dirname, "../../public/report-cards");
    this.ensurePublicFolderExists();
  }

  async ensurePublicFolderExists() {
    try {
      await fs.mkdir(this.publicFolder, { recursive: true });
    } catch (error) {
      console.error("Erreur création dossier:", error);
    }
  }

  getPublicUrl(filename) {
    return `/report-cards/${filename}`;
  }

  async generateAndSaveReportCardPDF(data) {
    const filename = `bulletin_${data.studentId}_${
      data.trimestreId
    }_${Date.now()}.pdf`;
    const filePath = path.join(this.publicFolder, filename);

    const pdfBuffer = await this.generateReportCardPDF(data);
    await fs.writeFile(filePath, pdfBuffer);

    return {
      publicUrl: this.getPublicUrl(filename),
      filePath,
      filename,
    };
  }

  generateReportCardPDF(data) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // --- En-tête moderne ---
      // --- En-tête moderne ---
      const headerHeight = 90;

      // Bandeau de couleur
      doc.rect(0, 0, doc.page.width, headerHeight).fill("#4a90e2");

      // Titre principal
      doc
        .fillColor("#ffffff")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text("BULLETIN SCOLAIRE", 0, 25, {
          align: "center",
        });

      // Sous-titre (année scolaire ou établissement)
      doc
        .fontSize(14)
        .font("Helvetica")
        .fillColor("#e0e0e0")
        .text("Année scolaire 2024 - 2025", 0, 55, {
          align: "center",
        });

      // Ligne de séparation avec ombrage
      doc
        .moveTo(0, headerHeight)
        .lineTo(doc.page.width, headerHeight)
        .lineWidth(2)
        .strokeColor("#357ABD")
        .stroke();

      doc.moveDown(2);

      // Zone d'informations
      const infoX = 70;
      doc
        .fontSize(12)
        .fillColor("#000")
        .font("Helvetica-Bold")
        .text("Nom : ", infoX, doc.y, { continued: true })
        .font("Helvetica")
        .text(`${data.student.user.nom} ${data.student.user.prenom}`);

      doc
        .font("Helvetica-Bold")
        .text("Classe : ", infoX, doc.y, { continued: true })
        .font("Helvetica")
        .text(`${data.student.class.nom}`);

      doc
        .font("Helvetica-Bold")
        .text("Trimestre : ", infoX, doc.y, { continued: true })
        .font("Helvetica")
        .text(`${data.trimestre.libelle}`);

      doc.moveDown(1);

      // --- Tableau des moyennes ---
      if (data.averages?.length > 0) {
        this._renderAveragesTable(doc, data.averages);
      }

      // --- Résultats généraux ---
      doc.moveDown(0.5);

      // Encadré avec fond clair
      const boxTop = doc.y;
      const boxHeight = 50;
      const boxWidth = 500;

      doc
        .rect(50, boxTop, boxWidth, boxHeight)
        .fillAndStroke("#f7faff", "#d0e4f7");

      doc
        .fillColor("#000")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(
          `Moyenne générale : ${data.moyenne_generale.toFixed(2)}/20`,
          60,
          boxTop + 10
        );

      doc
        .font("Helvetica")
        .fontSize(13)
        .text(
          `Rang dans la classe : ${
            data.rang_classe ? `#${data.rang_classe}` : "Non déterminé"
          }`,
          60,
          boxTop + 30
        );

      doc.moveDown(3);

      // --- Appréciation générale ---
      if (data.appreciation_generale) {
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor("#4a90e2")
          .text("Appréciation générale", { underline: false });
        doc.moveDown(0.3);

        // Encadré appréciation
        const appTop = doc.y;
        const appHeight = 80; // Ajustable
        doc
          .rect(50, appTop, boxWidth, appHeight)
          .fillAndStroke("#fffef5", "#f2e3a7");

        doc
          .fillColor("#000")
          .font("Helvetica")
          .fontSize(12)
          .text(data.appreciation_generale, 60, appTop + 10, {
            width: boxWidth - 20,
            align: "justify",
          });

        doc.moveDown(5);
      }

      // --- Pied de page ---
      doc
        .fontSize(10)
        .fillColor("#888")
        .text(`Fait le : ${new Date().toLocaleDateString()}`, {
          align: "right",
        });

      doc.end();
    });
  }

  _renderAveragesTable(doc, averages) {
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica").fillColor("#000000");

    const tableTop = doc.y;
    const startX = 50;
    const colWidths = [120, 60, 60, 60, 60, 60, 120];
    // Matière | Dev1 | Dev2 | Comp | Moy | Coef | Appréciation
    const rowHeight = 20;

    const headers = [
      "Matière",
      "Devoir 1",
      "Devoir 2",
      "Composition",
      "Moyenne",
      "Coef.",
      "Appréciation",
    ];
    headers.forEach((header, i) => {
      doc
        .rect(
          startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
          tableTop,
          colWidths[i],
          rowHeight
        )
        .fillAndStroke("#4a90e2", "#000");
      doc
        .fillColor("#fff")
        .text(
          header,
          startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5,
          tableTop + 5
        );
    });

    let y = tableTop + rowHeight;

    averages.forEach((avg, index) => {
      const fillColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";

      headers.forEach((_, i) => {
        doc
          .rect(
            startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
            y,
            colWidths[i],
            rowHeight
          )
          .fill(fillColor)
          .stroke();
      });

      doc
        .fillColor("#000")
        .text(avg.subject.nom, startX + 5, y + 5, { width: colWidths[0] - 10 });
      doc.text(
        avg.devoir1 !== null ? avg.devoir1.toFixed(2) : "-",
        startX + colWidths[0] + 5,
        y + 5,
        { width: colWidths[1] - 10 }
      );
      doc.text(
        avg.devoir2 !== null ? avg.devoir2.toFixed(2) : "-",
        startX + colWidths[0] + colWidths[1] + 5,
        y + 5,
        { width: colWidths[2] - 10 }
      );
      doc.text(
        avg.composition !== null ? avg.composition.toFixed(2) : "-",
        startX + colWidths[0] + colWidths[1] + colWidths[2] + 5,
        y + 5,
        { width: colWidths[3] - 10 }
      );
      doc.text(
        avg.moyenne.toFixed(2),
        startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5,
        y + 5,
        { width: colWidths[4] - 10 }
      );
      doc.text(
        avg.coefficient?.toString() || "-",
        startX +
          colWidths[0] +
          colWidths[1] +
          colWidths[2] +
          colWidths[3] +
          colWidths[4] +
          5,
        y + 5,
        { width: colWidths[5] - 10 }
      );
      doc.text(
        avg.appreciation || "-",
        startX + colWidths.slice(0, 6).reduce((a, b) => a + b, 0) + 5,
        y + 5,
        { width: colWidths[6] - 10 }
      );

      y += rowHeight;
    });

    doc.moveDown();
  }
}
