import PDFDocument from "pdfkit";

export default class PDFService {
  generateReportCardPDF(data) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // En-tête
      doc.fontSize(20).text("BULLETIN SCOLAIRE", { align: "center" });
      doc.moveDown();

      // Informations élève
      doc
        .fontSize(14)
        .text(`Élève: ${data.student.user.nom} ${data.student.user.prenom}`);
      doc.text(`Classe: ${data.student.class.nom}`);
      doc.text(`Trimestre: ${data.trimestre.libelle}`);
      doc.moveDown();

      // Tableau des moyennes
      if (data.averages?.length > 0) {
        this._renderAveragesTable(doc, data.averages);
      }

      // Résultats généraux
      doc.fontSize(16).text("Résultats généraux:", { underline: true });
      doc.text(`Moyenne générale: ${data.moyenne_generale.toFixed(2)}/20`);
      doc.text(
        `Rang dans la classe: ${
          data.rang_classe ? `#${data.rang_classe}` : "Non déterminé"
        }`
      );
      doc.moveDown();

      // Appréciation
      if (data.appreciation_generale) {
        doc.fontSize(14).text("Appréciation générale:");
        doc.fontSize(12).text(data.appreciation_generale, {
          width: 500,
          align: "justify",
        });
      }

      // Pied de page
      doc.text(`\n\nFait le: ${new Date().toLocaleDateString()}`, {
        align: "right",
      });

      doc.end();
    });
  }

  _renderAveragesTable(doc, averages) {
    doc.fontSize(16).text("Détail par matière:", { underline: true });
    doc.moveDown(0.5);

    // En-tête du tableau
    doc.font("Helvetica-Bold");
    this._drawTableRow(doc, 50, ["Matière", "Moyenne", "Rang", "Appréciation"]);
    doc.font("Helvetica");

    // Lignes du tableau
    let y = 180;
    averages.forEach((avg) => {
      y = this._drawTableRow(
        doc,
        y,
        [
          avg.subject.nom,
          `${avg.moyenne.toFixed(2)}/20`,
          avg.rang ? `#${avg.rang}` : "-",
          avg.appreciation || "-",
        ],
        { maxWidth: 150 }
      );
    });
    doc.moveDown();
  }

  _drawTableRow(doc, y, columns, options = {}) {
    const { maxWidth = 100 } = options;
    const startX = 50;
    const colWidth = (doc.page.width - 100) / columns.length;

    columns.forEach((text, i) => {
      doc.text(text, startX + i * colWidth, y, {
        width: Math.min(colWidth, maxWidth),
        align: "left",
      });
    });

    return y + 20;
  }
}
