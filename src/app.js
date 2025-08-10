import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import AuthRoute from "./routes/AuthRoute.js";
import TeacherRoute from "./routes/TeacherRoute.js";
import NiveauRoute from "./routes/NiveauRoute.js";
import AnneeScolaireRoute from "./routes/AnneeScolaireRoute.js";
import ClassRoute from "./routes/ClassRoute.js";
import SubjectRoute from "./routes/SubjectRoute.js";

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

app.route("/api/auth", authRoute.routes);
app.route('/api/teachers', teacherRoute.routes);
app.route('/api/niveaux', niveauRoute.routes);
app.route('/api/annees', anneeScolaireRoute.routes);
app.route('/api/classes', classRoute.routes);
app.route('/api/matieres', subjectRoute.routes);

export default app;
