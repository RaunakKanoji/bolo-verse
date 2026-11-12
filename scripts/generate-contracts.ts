import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { ShapeApiOperations, ShapeApiSchemas } from "../apps/web/src/lib/contracts/shape";
import { generateClient, generateModels, type Operation, type Schema } from "./lib/contract-generator";

const root = fileURLToPath(new URL("../packages/api-contract/", import.meta.url));
const check = process.argv.includes("--check");
const schemas = Object.fromEntries(Object.entries(ShapeApiSchemas).map(([key, value]) => {
  const emitted = z.toJSONSchema(value, { target: "draft-2020-12", unrepresentable: "throw" });
  delete emitted.$schema;
  return [key, emitted];
}));
const paths: Record<string, Record<string, unknown>> = {};
const ref = (key: string) => ({ $ref: `#/components/schemas/${key}` });
for (const operation of ShapeApiOperations) {
  const info: Operation = operation;
  paths[info.path] ??= {};
  if (paths[info.path][info.method]) throw new Error(`Duplicate operation: ${info.method} ${info.path}`);
  paths[info.path][info.method] = {
    operationId: info.operationId, summary: info.summary,
    security: info.security === "public" ? [] : [{ ClerkSession: [] }, { ClerkBearerSession: [] }],
    ...(info.pathParameters?.length ? { parameters: info.pathParameters.map((parameter) => ({ name: parameter, in: "path", required: true, schema: { type: "string", format: "uuid" } })) } : {}),
    ...(info.requestSchema ? { requestBody: { required: true, content: { "application/json": { schema: ref(info.requestSchema) } } } } : {}),
    responses: {
      [String(info.successStatus ?? 200)]: { description: "Successful response", content: { "application/json": { schema: ref(info.responseSchema) } } },
      default: { description: "Structured failure", content: { "application/json": { schema: ref("ErrorResponse") } } },
    },
  };
}
const openapi = {
  openapi: "3.1.0", jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
  info: { title: "Shape Studio shared API", version: "1.0.0", description: "Implemented v1 JSON operations. Authentication uses Clerk browser sessions or verified native session bearer JWTs; cookie mutations require trusted Origin, and supplied Origin must always be trusted. Binary media responses are documented separately." },
  paths, components: { securitySchemes: { ClerkSession: { type: "apiKey", in: "cookie", name: "__session", description: "Clerk validated session with server authorization; browser writes also require a trusted Origin." }, ClerkBearerSession: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Clerk session JWT for this instance. OAuth/machine tokens are not accepted; native tokens may omit Origin. Any supplied Origin must be trusted." } }, schemas },
};
const published = `${JSON.stringify(openapi, null, 2)}\n`;
// Both language outputs consume this exact serialized OpenAPI artifact, never Zod internals.
const artifact = JSON.parse(published) as typeof openapi;
const operations: Operation[] = Object.entries(artifact.paths).flatMap(([path, methods]) => Object.entries(methods).map(([method, raw]) => {
  const op = raw as { operationId: string; summary: string; security: unknown[]; parameters?: { name: string }[]; requestBody?: { content: { "application/json": { schema: { $ref: string } } } }; responses: Record<string, { content: { "application/json": { schema: { $ref: string } } } }> };
  const successStatus = Object.keys(op.responses).find((status) => /^2[0-9]{2}$/.test(status));
  if (!successStatus) throw new Error("Operation has no success response");
  return { successStatus: Number(successStatus), operationId: op.operationId, method: method as Operation["method"], path, summary: op.summary, security: op.security.length ? "session" : "public", pathParameters: op.parameters?.map((parameter) => parameter.name), responseSchema: op.responses[successStatus].content["application/json"].schema.$ref.split("/").at(-1)!, ...(op.requestBody ? { requestSchema: op.requestBody.content["application/json"].schema.$ref.split("/").at(-1)! } : {}) };
}));
const models = generateModels(artifact.components.schemas as Record<string, Schema>);
const client = generateClient(operations, artifact.components.schemas as Record<string, Schema>);
const outputs = new Map([
  ["openapi.json", published], ["generated/models.ts", models.typescript], ["generated/ShapeModels.swift", models.swift],
  ["generated/client.ts", client.typescript], ["generated/ShapeAPIRoutes.swift", client.swift],
  ["../../docs/api/openapi.yaml", published],
]);
for (const [path, expected] of outputs) {
  const target = resolve(root, path);
  if (check) {
    const actual = await readFile(target, "utf8").catch(() => "");
    if (actual !== expected) throw new Error(`Contract artifact is stale: ${path}. Run contracts:generate.`);
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, expected);
  }
}
console.log(`${check ? "Checked" : "Generated"} ${outputs.size} contract artifacts.`);
