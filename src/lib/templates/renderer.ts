import type { RenderedTemplate, TemplateContext } from "./types";

type Node =
  | { kind: "text"; value: string }
  | { kind: "var"; path: string; raw: string }
  | { kind: "if"; path: string; body: Node[]; raw: string }
  | { kind: "each"; path: string; body: Node[]; raw: string };

const TOKEN_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

interface Token {
  type: "text" | "tag";
  value: string;
  raw: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        value: input.slice(lastIndex, match.index),
        raw: input.slice(lastIndex, match.index),
      });
    }
    tokens.push({ type: "tag", value: match[1].trim(), raw: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < input.length) {
    tokens.push({
      type: "text",
      value: input.slice(lastIndex),
      raw: input.slice(lastIndex),
    });
  }
  return tokens;
}

function parse(tokens: Token[]): Node[] {
  let cursor = 0;

  function parseChildren(stopTags: string[]): Node[] {
    const out: Node[] = [];
    while (cursor < tokens.length) {
      const token = tokens[cursor];
      if (token.type === "text") {
        out.push({ kind: "text", value: token.value });
        cursor += 1;
        continue;
      }
      const expr = token.value;
      if (stopTags.includes(expr)) {
        return out;
      }
      if (expr.startsWith("#if ")) {
        const path = expr.slice(4).trim();
        cursor += 1;
        const body = parseChildren(["/if"]);
        if (tokens[cursor]?.value === "/if") cursor += 1;
        out.push({ kind: "if", path, body, raw: token.raw });
        continue;
      }
      if (expr.startsWith("#each ")) {
        const path = expr.slice(6).trim();
        cursor += 1;
        const body = parseChildren(["/each"]);
        if (tokens[cursor]?.value === "/each") cursor += 1;
        out.push({ kind: "each", path, body, raw: token.raw });
        continue;
      }
      if (expr === "/if" || expr === "/each") {
        cursor += 1;
        continue;
      }
      out.push({ kind: "var", path: expr, raw: token.raw });
      cursor += 1;
    }
    return out;
  }

  return parseChildren([]);
}

function resolvePath(
  path: string,
  scopes: ReadonlyArray<unknown>,
): { found: boolean; value: unknown } {
  const trimmed = path.trim();
  if (trimmed === "this" || trimmed === ".") {
    const top = scopes[scopes.length - 1];
    return { found: top !== undefined && top !== null, value: top };
  }
  const parts = trimmed.split(".");

  for (let i = scopes.length - 1; i >= 0; i -= 1) {
    const base = scopes[i];
    if (base === undefined || base === null) continue;
    const result = walk(base, parts);
    if (result.found) return result;
  }
  return { found: false, value: undefined };
}

function walk(
  base: unknown,
  parts: string[],
): { found: boolean; value: unknown } {
  let cursor: unknown = base;
  for (const part of parts) {
    if (cursor === null || cursor === undefined) {
      return { found: false, value: undefined };
    }
    if (typeof cursor !== "object" && !Array.isArray(cursor)) {
      return { found: false, value: undefined };
    }
    const record = cursor as Record<string, unknown>;
    if (!(part in record)) {
      return { found: false, value: undefined };
    }
    cursor = record[part];
  }
  return { found: true, value: cursor };
}

function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (value === false) return false;
  if (value === 0) return false;
  if (value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "object" && Object.keys(value as object).length === 0) {
    return false;
  }
  return true;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function renderNodes(
  nodes: Node[],
  scopes: ReadonlyArray<unknown>,
  missing: Set<string>,
): string {
  let out = "";
  for (const node of nodes) {
    switch (node.kind) {
      case "text":
        out += node.value;
        break;
      case "var": {
        const { found, value } = resolvePath(node.path, scopes);
        if (!found || value === undefined || value === null) {
          missing.add(node.path);
          out += "";
        } else {
          out += formatValue(value);
        }
        break;
      }
      case "if": {
        const { found, value } = resolvePath(node.path, scopes);
        if (found && isTruthy(value)) {
          out += renderNodes(node.body, scopes, missing);
        }
        break;
      }
      case "each": {
        const { found, value } = resolvePath(node.path, scopes);
        if (!found) {
          missing.add(node.path);
          break;
        }
        if (!Array.isArray(value)) break;
        for (const item of value) {
          out += renderNodes(node.body, [...scopes, item], missing);
        }
        break;
      }
    }
  }
  return out;
}

export interface RenderTemplateOptions {
  templateId?: string;
  version?: number;
  subject?: string | null;
}

export function renderTemplate(
  templateBody: string,
  context: TemplateContext,
  options: RenderTemplateOptions = {},
): RenderedTemplate {
  const missing = new Set<string>();
  const tokens = tokenize(templateBody ?? "");
  const ast = parse(tokens);
  const body = renderNodes(ast, [context as unknown], missing);

  let subject: string | null = options.subject ?? null;
  if (subject) {
    const subjectTokens = tokenize(subject);
    const subjectAst = parse(subjectTokens);
    subject = renderNodes(subjectAst, [context as unknown], missing);
  }

  return {
    templateId: options.templateId ?? "",
    version: options.version ?? 0,
    subject,
    body,
    missingMergeFields: Array.from(missing),
    renderedAt: new Date().toISOString(),
  };
}

export function extractMergeFields(templateBody: string): string[] {
  const out = new Set<string>();
  const tokens = tokenize(templateBody ?? "");
  for (const t of tokens) {
    if (t.type !== "tag") continue;
    const expr = t.value;
    if (expr.startsWith("#if ")) {
      out.add(expr.slice(4).trim());
    } else if (expr.startsWith("#each ")) {
      out.add(expr.slice(6).trim());
    } else if (expr === "/if" || expr === "/each") {
      continue;
    } else {
      out.add(expr);
    }
  }
  return Array.from(out);
}
