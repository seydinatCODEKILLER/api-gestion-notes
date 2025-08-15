import { Hono } from "hono";
import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serveStatic } from "hono/serve-static";

/* ---------- charge le JSON statique ---------- */
const swaggerDoc = JSON.parse(
  fs.readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "swagger.json"),
    "utf8"
  )
);

const docs = new Hono();

/* ---------- JSON brut ---------- */
docs.get("/openapi.json", (c) => c.json(swaggerDoc));

/* ---------- UI Swagger (CDN) ---------- */
const html = /* html */ `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Gestion des notes · Swagger</title>
  <link rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>html,body{margin:0;padding:0;height:100%}</style>
</head>
<body>
  <div id="swagger-ui" style="height:100%"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/docs/openapi.json',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>
`;

docs.get("/", (c) => c.html(html));

/* ---------- (optionnel) serve les assets locaux ---------- */
docs.use(
  "/swagger-ui-assets/*",
  serveStatic({
    root: "",
    rewriteRequestPath: (p) => p.replace("/docs/swagger-ui-assets", ""),
  })
);

export default docs;
