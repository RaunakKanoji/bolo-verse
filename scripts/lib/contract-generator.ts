/** Deliberately small OpenAPI 3.1 DTO generator. Unsupported constructs fail closed. */
export type Schema = Record<string, unknown>;
const identifier = /^[A-Za-z][A-Za-z0-9]*$/;
const keys = new Set(["$ref", "type", "properties", "required", "additionalProperties", "items", "prefixItems", "enum", "const", "anyOf", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "minLength", "maxLength", "format", "pattern", "minItems", "maxItems", "minProperties", "maxProperties", "description", "$schema"]);
const upper = (value: string) => value[0].toUpperCase() + value.slice(1);
const quote = JSON.stringify;
function object(value: unknown): Schema {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected schema object");
  return value as Schema;
}
function name(value: string) {
  if (!identifier.test(value)) throw new Error(`Unsupported identifier: ${value}`);
  return value;
}
function nullable(schema: Schema): Schema | undefined {
  if (Array.isArray(schema.anyOf)) {
    if (schema.anyOf.length !== 2) throw new Error("Only nullable anyOf is supported");
    const branches = schema.anyOf.map(object);
    const populated = branches.filter((branch) => branch.type !== "null");
    if (populated.length !== 1 || branches.filter((branch) => branch.type === "null").length !== 1) throw new Error("Only nullable anyOf is supported");
    return populated[0];
  }
  if (Array.isArray(schema.type)) {
    if (schema.type.length !== 2 || !schema.type.includes("null")) throw new Error("Only nullable type arrays are supported");
    return { ...schema, type: schema.type.find((entry) => entry !== "null") };
  }
}

export function generateModels(schemas: Record<string, Schema>) {
  const ts: string[] = [], swift: string[] = [];
  const declarations = new Map<string, string>();
  const schemaNames = new Set(Object.keys(schemas));
  function check(schema: Schema) {
    for (const key of Object.keys(schema)) if (!keys.has(key)) throw new Error(`Unsupported schema keyword: ${key}`);
  }
  function emit(typeName: string, schema: Schema, objectField = false): { ts: string; swift: string; tupleLength?: number } {
    name(typeName); check(schema);
    const nil = nullable(schema);
    if (nil) {
      const inner = emit(`${typeName}Value`, nil, objectField);
      return { ...inner, ts: `(${inner.ts} | null)`, swift: `${inner.swift}?` };
    }
    if (schema.$ref) {
      if (typeof schema.$ref !== "string" || !schema.$ref.startsWith("#/components/schemas/")) throw new Error("Only local component references are supported");
      const ref = schema.$ref.slice("#/components/schemas/".length);
      if (!schemaNames.has(ref)) throw new Error(`Unknown schema reference: ${ref}`);
      return { ts: name(ref), swift: name(ref) };
    }
    const values = schema.enum ?? (schema.const !== undefined ? [schema.const] : undefined);
    if (values) {
      if (!Array.isArray(values) || !values.length || !values.every((value) => typeof value === "string" || typeof value === "boolean" || Number.isSafeInteger(value))) throw new Error("Only nonempty string/integer/boolean enums are supported");
      if (!values.every((value) => typeof value === typeof values[0]) || new Set(values).size !== values.length) throw new Error("Mixed or duplicated enum values");
      if (typeof values[0] === "boolean") {
        if (values.length !== 1) throw new Error("Boolean enum must be a single literal");
        declare(typeName, `public enum ${typeName}: Codable, Sendable {\n  case value\n  public init(from decoder: any Decoder) throws {\n    let container = try decoder.singleValueContainer()\n    guard try container.decode(Bool.self) == ${values[0]} else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }\n    self = .value\n  }\n  public func encode(to encoder: any Encoder) throws {\n    var container = encoder.singleValueContainer()\n    try container.encode(${values[0]})\n  }\n}`);
        return { ts: String(values[0]), swift: typeName };
      }
      const caseNames = values.map((value, index) => typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value) ? value.replace(/[_-]([A-Za-z0-9])/g, (_match, letter: string) => letter.toUpperCase()) : `value${typeof value === "number" && value >= 0 ? value : index}`);
      if (new Set(caseNames).size !== caseNames.length) throw new Error("Swift enum case name collision");
      const cases = values.map((value, index) => `  case \`${caseNames[index]}\` = ${quote(value)}`).join("\n");
      declare(typeName, `public enum ${typeName}: ${typeof values[0] === "string" ? "String" : "Int"}, Codable, Sendable {\n${cases}\n}`);
      return { ts: values.map((value) => quote(value)).join(" | "), swift: typeName };
    }
    if (schema.type === "string") return { ts: "string", swift: "String" };
    if (schema.type === "number") return { ts: "number", swift: "Double" };
    if (schema.type === "integer") return { ts: "number", swift: "Int64" };
    if (schema.type === "boolean") return { ts: "boolean", swift: "Bool" };
    if (schema.type === "array" && schema.prefixItems !== undefined) {
      const members = schema.prefixItems;
      if (!objectField || !Array.isArray(members) || ![3, 4].includes(members.length) || schema.items !== false || schema.minItems !== members.length || schema.maxItems !== members.length) {
        throw new Error("Only closed three/four-number tuples directly in object fields are supported");
      }
      const first = object(members[0]);
      check(first);
      if (first.type !== "number" || Object.keys(first).some((key) => !["type", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "description"].includes(key)) || members.some((member) => JSON.stringify(member) !== JSON.stringify(first))) throw new Error("Only homogeneous numeric tuples are supported");
      return { ts: `[${members.map(() => "number").join(", ")}]`, swift: "[Double]", tupleLength: members.length };
    }
    if (schema.type === "array") {
      const item = emit(`${typeName}Item`, object(schema.items));
      return { ts: `Array<${item.ts}>`, swift: `[${item.swift}]` };
    }
    if (schema.type !== "object" || schema.additionalProperties !== false) throw new Error("Only closed object schemas are supported");
    const properties = object(schema.properties ?? {});
    const requiredProperties = schema.required ?? [];
    if (!Array.isArray(requiredProperties) || !requiredProperties.every((key) => typeof key === "string" && key in properties)) throw new Error("Object requires an explicit valid required array");
    const required = new Set(requiredProperties as string[]);
    const fields = Object.entries(properties).map(([key, value]) => {
      name(key);
      const child = object(value), isNullable = !!nullable(child);
      if (!required.has(key) && isNullable) throw new Error("Optional nullable fields require a three-state representation; unsupported");
      return { key, required: required.has(key), ...emit(`${typeName}${upper(key)}`, child, true) };
    });
    const members = fields.map((field) => `  public var \`${field.key}\`: ${field.swift}${field.required ? "" : "?"}`).join("\n");
    const initializer = `  public init(${fields.map((field) => `\`${field.key}\`: ${field.swift}${field.required ? "" : "? = nil"}`).join(", ")}) {\n${fields.map((field) => `    self.\`${field.key}\` = \`${field.key}\``).join("\n")}\n  }`;
    const codingKeys = fields.map((field) => `    case \`${field.key}\``).join("\n");
    const tupleCount = (field: typeof fields[number]) => `self.\`${field.key}\`${!field.required || field.swift.endsWith("?") ? `?.count ?? ${field.tupleLength}` : ".count"}`;
    const decode = fields.map((field) => `    self.\`${field.key}\` = ${field.required ? "" : `container.contains(.\`${field.key}\`) ? `}try container.decode(${field.swift}.self, forKey: .\`${field.key}\`)${field.required ? "" : " : nil"}${field.tupleLength ? `\n    guard (${tupleCount(field)}) == ${field.tupleLength} else { throw DecodingError.dataCorruptedError(forKey: .\`${field.key}\`, in: container, debugDescription: "Expected exactly ${field.tupleLength} vector components") }` : ""}`).join("\n");
    const encode = fields.map((field) => `${field.tupleLength ? `    guard (${tupleCount(field)}) == ${field.tupleLength} else { throw EncodingError.invalidValue(self.\`${field.key}\` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly ${field.tupleLength} vector components")) }\n` : ""}    try container.${field.required ? "encode" : "encodeIfPresent"}(self.\`${field.key}\`, forKey: .\`${field.key}\`)`).join("\n");
    declare(typeName, `public struct ${typeName}: Codable, Sendable {\n${members}\n\n${initializer}\n\n  private enum CodingKeys: String, CodingKey {\n${codingKeys}\n  }\n\n  public init(from decoder: any Decoder) throws {\n    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)\n    let allowed: Set<String> = Set([${fields.map((field) => quote(field.key)).join(", ")}])\n    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {\n      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ${typeName} property"))\n    }\n    let container = try decoder.container(keyedBy: CodingKeys.self)\n${decode}\n  }\n\n  public func encode(to encoder: any Encoder) throws {\n    var container = encoder.container(keyedBy: CodingKeys.self)\n${encode}\n  }\n}`);
    return { ts: `{\n${fields.map((field) => `  ${field.key}${field.required ? "" : "?"}: ${field.ts};`).join("\n")}\n}`, swift: typeName };
  }
  function declare(typeName: string, body: string) {
    const existing = declarations.get(typeName);
    if (existing && existing !== body) throw new Error(`Generated Swift name collision: ${typeName}`);
    declarations.set(typeName, body);
  }
  for (const [typeName, schema] of Object.entries(schemas)) {
    const type = emit(name(typeName), schema);
    ts.push(`export type ${typeName} = ${type.ts};`);
    if (type.swift !== typeName) swift.push(`public typealias ${typeName} = ${type.swift}`);
  }
  return {
    typescript: `// Generated from openapi.json. Do not edit.\n// DTO types only; server Zod schemas enforce constraints.\n\n${ts.join("\n\n")}\n`,
    swift: `// Generated from openapi.json. Do not edit.\n// DTO decoding enforces shapes/enums; server schemas enforce bounds and formats.\nimport Foundation\n\nprivate struct ShapeAnyCodingKey: CodingKey {\n  var stringValue: String\n  var intValue: Int? { nil }\n  init?(stringValue: String) { self.stringValue = stringValue }\n  init?(intValue: Int) { return nil }\n}\n\n${[...declarations.values(), ...swift].join("\n\n")}\n`,
  };
}

export type Operation = {
  operationId: string; method: "get" | "post" | "put" | "patch"; path: string;
  responseSchema: string; requestSchema?: string; summary: string;
  security: "public" | "session"; pathParameters?: readonly string[]; successStatus?: number;
};
export function generateClient(operations: readonly Operation[], schemas: Record<string, Schema>) {
  for (const operation of operations) {
    name(operation.operationId);
    if (!schemas[operation.responseSchema] || operation.requestSchema && !schemas[operation.requestSchema]) throw new Error("Unknown operation schema");
    if (!/^\/api\/v1\/[A-Za-z0-9/{}-]+$/.test(operation.path)) throw new Error("Unsupported operation path");
    const parameters = Array.from(operation.path.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g), (match) => match[1]);
    if (JSON.stringify(parameters) !== JSON.stringify(operation.pathParameters ?? [])) throw new Error("Operation path parameters mismatch");
  }
  const methods = operations.map((operation) => {
    const parameters = operation.pathParameters ?? [];
    const args = [...parameters.map((param) => `${param}: string`), ...(operation.requestSchema ? [`body: Models.${operation.requestSchema}`] : []), "signal?: AbortSignal"].join(", ");
    const path = operation.path.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_match, param: string) => `\${encodeURIComponent(${param})}`);
    return `    ${operation.operationId}(${args}): Promise<Models.${operation.responseSchema}> {\n      return request(\`${path}\`, { method: ${quote(operation.method.toUpperCase())}, signal${operation.requestSchema ? ', headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)' : ""} });\n    },`;
  });
  const swiftRoutes = operations.map((operation) => {
    const parameters = operation.pathParameters ?? [];
    const args = parameters.map((param) => `${param}: String`).join(", ");
    const path = operation.path.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_match, param: string) => `\\(segment(${param}))`);
    return `  /// ${operation.method.toUpperCase()}; response: ${operation.responseSchema}${operation.requestSchema ? `; body: ${operation.requestSchema}` : ""}.\n  public static func ${operation.operationId}(${args}) -> String { "${path}" }`;
  });
  return {
    typescript: `// Generated from openapi.json. Do not edit.\nimport type * as Models from "./models";\n\nexport class ShapeApiError extends Error {\n  constructor(public readonly status: number, public readonly payload: unknown) {\n    super(\`Shape API request failed (\${status})\`);\n    this.name = "ShapeApiError";\n  }\n}\n\n/** Browser same-origin client; never embeds credentials or bypasses server authorization. */\nexport function createShapeClient(fetcher: typeof fetch = fetch) {\n  async function request<T>(path: string, init: RequestInit): Promise<T> {\n    const response = await fetcher(path, { ...init, credentials: "same-origin" });\n    const payload: unknown = await response.json();\n    if (!response.ok) throw new ShapeApiError(response.status, payload);\n    return payload as T;\n  }\n  return {\n${methods.join("\n")}\n  };\n}\n`,
    swift: `// Generated from openapi.json. Do not edit.\nimport Foundation\n\n/// Relative paths only; authentication and URLSession transport belong to the native app.\npublic enum ShapeAPIRoutes {\n  private static func segment(_ value: String) -> String {\n    value.addingPercentEncoding(withAllowedCharacters: CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"))!\n  }\n${swiftRoutes.join("\n")}\n}\n`,
  };
}
