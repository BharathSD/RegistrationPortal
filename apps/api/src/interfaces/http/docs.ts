import path from "node:path";
import fs from "node:fs";
import { type Express } from "express";
import swaggerUi from "swagger-ui-express";
import { load as loadYaml } from "js-yaml";

/** Mounts /openapi.json and the Swagger UI at /docs, both sourced from openapi.yaml. */
export function mountApiDocs(app: Express): void {
  const openapiDocument = loadYaml(
    fs.readFileSync(path.resolve(__dirname, "../../../openapi.yaml"), "utf8"),
  ) as Record<string, unknown>;
  app.get("/openapi.json", (_req, res) => res.json(openapiDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
}
