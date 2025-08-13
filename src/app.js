import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import AuthRoute from "./routes/AuthRoute.js";
import TeacherRoute from "./routes/TeacherRoute.js";
import NiveauRoute from "./routes/NiveauRoute.js";
import AnneeScolaireRoute from "./routes/AnneeScolaireRoute.js";
import ClassRoute from "./routes/ClassRoute.js";
import SubjectRoute from "./routes/SubjectRoute.js";
import ClassSubjectRoute from "./routes/ClassSubjectRoute.js";
import TeacherSubjectRoute from "./routes/TeacherSubjectRoute.js";
import StudentRoute from "./routes/StudentRoute.js";
import TrimestreRoute from "./routes/TrimestreRoute.js";
import GradeRoute from "./routes/GradeRoute.js";
import AverageRoute from "./routes/AverageRoute.js";

const app = new Hono();

// Middlewares globaux
app.use("*", logger());
app.use("*", cors());

// Routes
const authRoute = new AuthRoute();
const teacherRoute = new TeacherRoute();
const niveauRoute = new NiveauRoute();
const anneeScolaireRoute = new AnneeScolaireRoute();
const classRoute = new ClassRoute();
const subjectRoute = new SubjectRoute();
const classSubjectRoute = new ClassSubjectRoute();
const teacherSubjectRoute = new TeacherSubjectRoute();
const studentRoute = new StudentRoute();
const trimestreRoute = new TrimestreRoute();
const gradeRoute = new GradeRoute();
const averageRoute = new AverageRoute();

app.route("/api/auth", authRoute.routes);
app.route('/api/teachers', teacherRoute.routes);
app.route('/api/niveaux', niveauRoute.routes);
app.route('/api/annees', anneeScolaireRoute.routes);
app.route('/api/classes', classRoute.routes);
app.route('/api/matieres', subjectRoute.routes);
app.route('/api/class-subjects', classSubjectRoute.routes);
app.route('/api/teacher-subjects', teacherSubjectRoute.routes);
app.route('/api/students', studentRoute.routes);
app.route('/api/trimestres', trimestreRoute.routes);
app.route('/api/grades', gradeRoute.routes);
app.route('/api/averages', averageRoute.routes);

export default app;
