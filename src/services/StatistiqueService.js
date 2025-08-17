import { prisma } from "../config/database.js";

export default class StatistiqueService {
  async getGlobalStatistics(anneeScolaireId, trimestreId) {
    return prisma.$transaction(async (tx) => {
      const reportCards = await tx.reportCard.findMany({
        where: {
          trimestreId,
          ...(anneeScolaireId && { anneeScolaireId }),
        },
        include: {
          student: { include: { user: true, class: true } },
        },
        orderBy: { moyenne_generale: "desc" },
        take: 5,
      });

      if (reportCards.length === 0) {
        return {
          moyenne_generale_globale: 0,
          top5_eleves: [],
          classes_en_difficulte: [],
        };
      }

      // 2. Calculer la moyenne générale globale
      const totalMoyennes = reportCards.reduce(
        (sum, rc) => sum + parseFloat(rc.moyenne_generale),
        0
      );
      const moyenneGeneraleGlobale = totalMoyennes / reportCards.length;

      // 3. Récupérer le top 5 des élèves
      const sortedStudents = [...reportCards]
        .sort(
          (a, b) =>
            parseFloat(b.moyenne_generale) - parseFloat(a.moyenne_generale)
        )
        .slice(0, 5);

      const top5Eleves = sortedStudents.map((rc) => ({
        eleve: `${rc.student.user.prenom} ${rc.student.user.nom}`,
        classe: rc.student.class?.nom || "Non affecté",
        moyenne: parseFloat(rc.moyenne_generale),
      }));

      // 4. Identifier les classes en difficulté (moyenne < 10)
      const classesMap = new Map();

      reportCards.forEach((rc) => {
        if (!rc.student.class) return;

        const classId = rc.student.class.id;
        if (!classesMap.has(classId)) {
          classesMap.set(classId, {
            nom: rc.student.class.nom,
            totalMoyenne: 0,
            count: 0,
          });
        }

        const classe = classesMap.get(classId);
        classe.totalMoyenne += parseFloat(rc.moyenne_generale);
        classe.count++;
      });

      const classesEnDifficulte = [];
      for (const [classId, data] of classesMap.entries()) {
        const moyenneClasse = data.totalMoyenne / data.count;
        if (moyenneClasse < 10) {
          classesEnDifficulte.push({
            classe: data.nom,
            moyenne_classe: parseFloat(moyenneClasse.toFixed(2)),
          });
        }
      }

      return {
        moyenne_generale_globale: parseFloat(moyenneGeneraleGlobale.toFixed(2)),
        top5_eleves: top5Eleves,
        classes_en_difficulte: classesEnDifficulte,
      };
    });
  }
}
