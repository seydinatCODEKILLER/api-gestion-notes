// src/services/PDFService.js
import PDFDocument from "pdfkit";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class PDFService {
  constructor() {
    this.basePublicFolder = path.join(__dirname, "../../public");
  }

  async ensureFolderExists(folder) {
    try {
      await fs.mkdir(folder, { recursive: true });
    } catch (error) {
      console.error("Erreur création dossier:", error);
    }
  }

  getPublicUrl(folderName, filename) {
    return `/${folderName}/${filename}`;
  }

  /* ================================
      GENERATION BULLETIN PDF
  ================================ */
  async generateAndSaveReportCardPDF(data) {
    const folderName = "report-cards";
    const folderPath = path.join(this.basePublicFolder, folderName);
    await this.ensureFolderExists(folderPath);

    const filename = `bulletin_${data.studentId}_${
      data.trimestreId
    }_${Date.now()}.pdf`;
    const filePath = path.join(folderPath, filename);

    const pdfBuffer = await this._generateReportCardPDF(data);
    await fs.writeFile(filePath, pdfBuffer);

    return {
      filename,
      filePath,
      publicUrl: this.getPublicUrl(folderName, filename),
    };
  }

  _generateReportCardPDF(data) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // --- Entête ---
      const headerHeight = 90;
      doc.rect(0, 0, doc.page.width, headerHeight).fill("#4a90e2");
      doc
        .fillColor("#ffffff")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text("BULLETIN SCOLAIRE", 0, 25, { align: "center" });
      doc
        .fontSize(14)
        .font("Helvetica")
        .fillColor("#e0e0e0")
        .text("Année scolaire 2024 - 2025", 0, 55, { align: "center" });
      doc
        .moveTo(0, headerHeight)
        .lineTo(doc.page.width, headerHeight)
        .lineWidth(2)
        .strokeColor("#357ABD")
        .stroke();

      doc.moveDown(2);

      // --- Informations élève ---
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
        this._renderDynamicTable(doc, data.averages, { type: "bulletin" });
      }

      // --- Résultats généraux ---
      doc.moveDown(0.5);
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

        const appTop = doc.y;
        const appHeight = 80;
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

  /* ================================
      GENERATION NOTES PDF
  ================================ */
  async generateGradesPDF(data) {
    const folderName = "grades";
    const folderPath = path.join(this.basePublicFolder, folderName);
    await this.ensureFolderExists(folderPath);

    const filename = `notes_${Date.now()}.pdf`;
    const filePath = path.join(folderPath, filename);

    const pdfBuffer = await this._generateGradesPDFBuffer(data);
    await fs.writeFile(filePath, pdfBuffer);

    return {
      filename,
      filePath,
      publicUrl: this.getPublicUrl(folderName, filename),
    };
  }

  _generateGradesPDFBuffer(data) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Entête
      const headerHeight = 60;
      doc.rect(0, 0, doc.page.width, headerHeight).fill("#4a90e2");
      doc
        .fillColor("#ffffff")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("EXPORT DES NOTES", 0, 20, { align: "center" });
      doc.moveDown(2);

      // Table dynamique
      this._renderDynamicTable(doc, data.grades, { type: "grades" });

      // Pied de page
      doc
        .fontSize(10)
        .fillColor("#888")
        .text(
          `Fait le : ${new Date().toLocaleDateString()}`,
          50,
          doc.page.height - 50,
          { align: "right" }
        );

      doc.end();
    });
  }

  /* ================================
      TABLEAUX DYNAMIQUES
  ================================ */
  _renderDynamicTable(doc, rows, options) {
    const startX = 50;
    let y = doc.y;
    const rowHeight = 20;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    let headers = [];
    let colWidths = [];

    if (options.type === "bulletin") {
      headers = ["Matière"];
      const maxDevoirs = Math.max(
        ...rows.map(
          (r) => ["devoir1", "devoir2"].filter((k) => r[k] !== null).length
        )
      );
      for (let i = 1; i <= maxDevoirs; i++) headers.push(`Devoir ${i}`);
      headers.push("Composition", "Moyenne", "Coef.", "Appréciation");

      const fixedWidths = [120, 60, 60, 60, 60, 60, 120];
      colWidths = fixedWidths.slice(0, headers.length);
    } else if (options.type === "grades") {
      headers = ["Élève"];
      const maxDevoirs = Math.max(...rows.map((r) => r.devoirs.length));
      for (let i = 1; i <= maxDevoirs; i++) headers.push(`Devoir ${i}`);
      headers.push("Composition", "Moyenne");

      const remainingWidth = pageWidth - 150 - 80 - 80;
      const devoirWidth = remainingWidth / maxDevoirs;
      colWidths = [150, ...Array(maxDevoirs).fill(devoirWidth), 80, 80];
    }

    // --- En-tête ---
    headers.forEach((header, i) => {
      doc
        .rect(
          startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
          y,
          colWidths[i],
          rowHeight
        )
        .fillAndStroke("#4a90e2", "#000");
      doc
        .fillColor("#fff")
        .fontSize(12)
        .text(
          header,
          startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 3,
          y + 5
        );
    });
    y += rowHeight;

    // --- Lignes ---
    rows.forEach((row, idx) => {
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        y = 50;
      }

      const fillColor = idx % 2 === 0 ? "#f2f2f2" : "#ffffff";

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

      if (options.type === "bulletin") {
        doc.fillColor("#000").fontSize(12);
        doc.text(row.subject.nom, startX + 5, y + 5, {
          width: colWidths[0] - 10,
        });
        doc.text(
          row.devoir1 !== null ? row.devoir1.toFixed(2) : "-",
          startX + colWidths[0] + 5,
          y + 5,
          { width: colWidths[1] - 10 }
        );
        doc.text(
          row.devoir2 !== null ? row.devoir2.toFixed(2) : "-",
          startX + colWidths[0] + colWidths[1] + 5,
          y + 5,
          { width: colWidths[2] - 10 }
        );
        doc.text(
          row.composition !== null ? row.composition.toFixed(2) : "-",
          startX + colWidths[0] + colWidths[1] + colWidths[2] + 5,
          y + 5,
          { width: colWidths[3] - 10 }
        );
        doc.text(
          row.moyenne.toFixed(2),
          startX +
            colWidths[0] +
            colWidths[1] +
            colWidths[2] +
            colWidths[3] +
            5,
          y + 5,
          { width: colWidths[4] - 10 }
        );
        doc.text(
          row.coefficient?.toString() || "-",
          startX + colWidths.slice(0, 5).reduce((a, b) => a + b, 0) + 5,
          y + 5,
          { width: colWidths[5] - 10 }
        );
        doc.text(
          row.appreciation || "-",
          startX + colWidths.slice(0, 6).reduce((a, b) => a + b, 0) + 5,
          y + 5,
          { width: colWidths[6] - 10 }
        );
      } else if (options.type === "grades") {
        doc.fillColor("#000").fontSize(12);
        doc.text(
          `${row.student.user.nom} ${row.student.user.prenom}`,
          startX + 3,
          y + 5,
          { width: colWidths[0] - 6 }
        );
        row.devoirs.forEach((d, i) => {
          doc.text(
            d.toFixed(2),
            startX + colWidths.slice(0, 1 + i).reduce((a, b) => a + b, 0) + 3,
            y + 5,
            { width: colWidths[1] - 6 }
          );
        });
        const composition =
          row.composition !== null ? row.composition.toFixed(2) : "-";
        doc.text(
          composition,
          startX +
            colWidths
              .slice(0, 1 + row.devoirs.length)
              .reduce((a, b) => a + b, 0) +
            3,
          y + 5,
          { width: colWidths[1] - 6 }
        );

        doc.text(
          row.moyenne?.toFixed(2) || "-",
          startX +
            colWidths
              .slice(0, 1 + row.devoirs.length + 1) // colonne après devoirs et composition
              .reduce((a, b) => a + b, 0) +
            3,
          y + 5,
          { width: colWidths[2] - 6 }
        );

      }

      y += rowHeight;
    });

    doc.moveDown();
  }
}
