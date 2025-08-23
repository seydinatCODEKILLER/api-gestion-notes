import "module-alias/register.js";
import { serve } from "@hono/node-server";
import app from "./app.js";
import { env } from "./config/env.js";

// Démarrage du serveur
serve(
  {
    fetch: app.fetch,
    port: env.PORT,
    hostname: "0.0.0.0", // <- Important pour Render
  },
  (info) => {
    console.log(`✅ Serveur démarré sur : http://0.0.0.0:${info.port}`);
    console.log(`📖 Documentation Swagger : http://0.0.0.0:${info.port}/docs`);
  }
);
