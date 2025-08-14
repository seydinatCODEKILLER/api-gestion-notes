export default class PDFHelper {
  getAppreciation(moyenne) {
    if (moyenne >= 16) return "Excellent travail, félicitations !";
    if (moyenne >= 14) return "Très bon trimestre, continuez ainsi.";
    if (moyenne >= 12) return "Bon travail, des efforts constants.";
    if (moyenne >= 10) return "Travail satisfaisant, mais peut mieux faire.";
    if (moyenne >= 8)
      return "Résultats insuffisants, des efforts sont nécessaires.";
    return "Très faibles résultats, un travail sérieux est indispensable.";
  }
}
