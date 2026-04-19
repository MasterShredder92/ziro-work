/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const {
  createAdminClient,
  exactCount,
  getTableColumns,
  resolveCrossProjectConfig,
} = require("./lib/crossProjectSupabase");

const CRITICAL_TABLES: readonly string[] = (
  require(path.join(__dirname, "schema", "public-sync-order.json")) as {
    table: string;
    primaryKey: string;
  }[]
).map((row) => row.table);

async function tableExists(
  client: ReturnType<typeof createAdminClient>,
  table: string,
): Promise<boolean> {
  const { error } = await client.from(table).select("*").limit(1);
  if (!error) return true;
  const msg = (error.message || "").toLowerCase();
  if (
    msg.includes("does not exist") ||
    msg.includes("not found") ||
    msg.includes("could not find") ||
    msg.includes("relation") ||
    msg.includes("schema cache")
  ) {
    return false;
  }
  return true;
}

type TableAudit = {
  sourceExists: boolean;
  targetExists: boolean;
  sourceCount: number | null;
  targetCount: number | null;
  missingColumnsInTarget: string[];
};

async function main() {
  const cfg = resolveCrossProjectConfig();
  const source = createAdminClient(cfg.sourceUrl, cfg.sourceServiceRoleKey);
  const target = createAdminClient(cfg.targetUrl, cfg.targetServiceRoleKey);

  const tables: Record<string, TableAudit> = {};
  const missingInTarget: string[] = [];
  const missingInSource: string[] = [];
  const mismatchedCounts: string[] = [];

  for (const table of CRITICAL_TABLES) {
    const [sourceExists, targetExists] = await Promise.all([
      tableExists(source, table),
      tableExists(target, table),
    ]);

    if (!sourceExists) missingInSource.push(table);
    if (!targetExists) missingInTarget.push(table);

    let sourceCount: number | null = null;
    let targetCount: number | null = null;
    let missingColumnsInTarget: string[] = [];

    if (sourceExists) sourceCount = await exactCount(source, table);
    if (targetExists) targetCount = await exactCount(target, table);

    if (sourceExists && targetExists) {
      const [sourceColumns, targetColumns] = await Promise.all([
        getTableColumns(
          source,
          table,
          cfg.sourceUrl,
          cfg.sourceServiceRoleKey,
        ),
        getTableColumns(
          target,
          table,
          cfg.targetUrl,
          cfg.targetServiceRoleKey,
        ),
      ]);
      const targetSet = new Set(targetColumns.columns);
      missingColumnsInTarget = sourceColumns.columns.filter(
        (column: string) => !targetSet.has(column),
      );
    }

    if (
      sourceCount !== null &&
      targetCount !== null &&
      sourceCount !== targetCount
    ) {
      mismatchedCounts.push(table);
    }

    tables[table] = {
      sourceExists,
      targetExists,
      sourceCount,
      targetCount,
      missingColumnsInTarget,
    };
  }

  const report = {
    sourceProject: cfg.sourceUrl,
    targetProject: cfg.targetUrl,
    generatedAt: new Date().toISOString(),
    missingInSource,
    missingInTarget,
    mismatchedCounts,
    readyForCrossProjectSync:
      missingInSource.length === 0 &&
      missingInTarget.length === 0 &&
      Object.values(tables).every((table) => table.missingColumnsInTarget.length === 0),
    tables,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

export {};
