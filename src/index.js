import "module-alias/register.js";
import { serve } from "@hono/node-server";
import app from "./app.js";
import { env } from "./config/env.js";

// Démarrage du serveur
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`✅ Serveur démarré sur : http://localhost:${info.port}`);
});
