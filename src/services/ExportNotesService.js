import PDFService from "./PDFService.js";
import { prisma } from "../config/database.js";

export default class ExportNotesService {
  constructor() {
    this.pdfService = new PDFService();
  }

  async generateGradesPDF({ classId, subjectId, trimestreId }) {
    if (!classId || !subjectId) throw new Error("classId et subjectId requis");

    // Récupérer les informations supplémentaires
    const classroom = await prisma.class.findUnique({
      where: { id: classId },
      select: { nom: true },
    });

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { nom: true },
    });

    const trimestre = trimestreId
      ? await prisma.trimestre.findUnique({
          where: { id: trimestreId },
          select: { libelle: true },
        })
      : null;

    // Récupérer les notes avec les informations des étudiants
    const grades = await prisma.grade.findMany({
      where: {
        student: { classId: classId }, // ici on filtre via la relation
        subjectId,
        ...(trimestreId && { trimestreId }),
      },
      include: {
        student: {
          include: { user: { select: { nom: true, prenom: true } } },
        },
        subject: { select: { nom: true } },
      },
      orderBy: [
        { student: { user: { nom: "asc" } } },
        { student: { user: { prenom: "asc" } } },
      ],
    });

    if (!grades.length) throw new Error("Aucune note trouvée");

    // Formater les données pour le PDF
    const formattedGrades = grades.reduce((acc, grade) => {
      const studentKey = `${grade.student.user.nom}_${grade.student.user.prenom}`;

      if (!acc[studentKey]) {
        acc[studentKey] = {
          student: grade.student,
          devoirs: [],
          composition: null,
          subject: grade.subject,
        };
      }

      if (grade.type_note === "devoir") {
        acc[studentKey].devoirs.push(grade.note);
      } else if (grade.type_note === "composition") {
        acc[studentKey].composition = grade.note;
      }

      return acc;
    }, {});

    // Calcul des moyennes
    // Calcul des moyennes
    const gradesWithAverages = Object.values(formattedGrades).map(
      (studentGrade) => {
        const notes = [...studentGrade.devoirs.map((n) => Number(n))];
        if (studentGrade.composition !== null)
          notes.push(Number(studentGrade.composition));

        const moyenne =
          notes.length > 0
            ? notes.reduce((sum, note) => sum + note, 0) / notes.length
            : null;

        return {
          ...studentGrade,
          moyenne: moyenne !== null ? parseFloat(moyenne.toFixed(2)) : null,
        };
      }
    );

    // Données pour le PDF
    const pdfData = {
      classroom: classroom.nom,
      subject: subject.nom,
      trimestre: trimestre?.libelle || "Tous trimestres",
      grades: gradesWithAverages,
    };

    // Génération du PDF
    const { filePath, publicUrl } = await this.pdfService.generateGradesPDF(
      pdfData
    );

    return {
      filePath,
      publicUrl,
      filename: `Notes_${classroom.nom}_${subject.nom}_${
        trimestre?.libelle || "all"
      }.pdf`,
    };
  }
}