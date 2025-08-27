import "module-alias/register.js";
import { serve } from "@hono/node-server";
import app from "./app.js";
import { env } from "./config/env.js";

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
    hostname: env.HOST,
  },
  (info) => {
    console.log(`✅ Serveur démarré sur : http://${env.HOST}:${info.port}`);
    console.log(`📖 Documentation Swagger : http://${env.HOST}:${info.port}/docs`);
  }
);
