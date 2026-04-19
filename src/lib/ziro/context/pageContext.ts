import {
  getPageBindings,
  type PageBindings,
} from "@/lib/ziro/runtime/pageIntelligence";
import {
  CONTEXT_LOADERS,
  CONTEXT_LOADER_ID_KEYS,
  isContextLoaderName,
  type ContextLoaderName,
  type EntityContext,
} from "./loaders";

export type PageSearchParams =
  | Record<string, string | string[] | undefined | null>
  | URLSearchParams
  | null
  | undefined;

export type ExtractPageContextInput = {
  pathname: string | null | undefined;
  searchParams?: PageSearchParams;
};

export type LoadedContext = Partial<
  Record<ContextLoaderName, EntityContext | null>
>;

export type ExtractedPageContext = {
  pageKey: string;
  agent: string;
  pathname: string;
  bindings: PageBindings;
  context: LoadedContext;
  quickActions: string[];
};

export function pageKeyFromPath(pathname: string | null | undefined): string {
  if (!pathname) return "dashboard";
  const trimmed = pathname.replace(/^\/+|\/+$/g, "");
  if (trimmed.length === 0) return "dashboard";
  const first = trimmed.split("/")[0];
  return first || "dashboard";
}

function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  const trimmed = pathname.trim();
  if (trimmed.length === 0) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function readParam(
  params: PageSearchParams,
  key: string,
): string | null {
  if (!params) return null;
  if (params instanceof URLSearchParams) {
    const value = params.get(key);
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  const raw = (params as Record<string, unknown>)[key];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry === "string" && entry.trim().length > 0) {
        return entry.trim();
      }
    }
    return null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstParam(
  params: PageSearchParams,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = readParam(params, key);
    if (value) return value;
  }
  return null;
}

export async function extractPageContext(
  input: ExtractPageContextInput,
): Promise<ExtractedPageContext> {
  const pathname = normalizePath(input.pathname);
  const bindings = getPageBindings(pathname);
  const pageKey = pageKeyFromPath(pathname);
  const searchParams = input.searchParams ?? null;

  const loaderNames: ContextLoaderName[] = [];
  for (const name of bindings.contextLoaders) {
    if (isContextLoaderName(name) && !loaderNames.includes(name)) {
      loaderNames.push(name);
    }
  }

  const loaded = await Promise.all(
    loaderNames.map(async (name) => {
      const loader = CONTEXT_LOADERS[name];
      const idKeys = CONTEXT_LOADER_ID_KEYS[name];
      const id = firstParam(searchParams, idKeys);
      if (!id) return [name, null] as const;
      try {
        const value = await loader(id);
        return [name, value] as const;
      } catch {
        return [name, null] as const;
      }
    }),
  );

  const context: LoadedContext = {};
  for (const [name, value] of loaded) {
    context[name] = value;
  }

  return {
    pageKey,
    agent: bindings.agent,
    pathname,
    bindings,
    context,
    quickActions: [...bindings.skills],
  };
}
