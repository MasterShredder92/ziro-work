import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import { runFullAudit } from "../src/lib/audit/runFullAudit";
async function main() {
    try {
        const report = await runFullAudit();
        console.log(JSON.stringify(report, null, 2));
    }
    catch (err) {
        console.log(JSON.stringify({
            error: err instanceof Error ? err.message : String(err),
            tables: {},
            readyForMigration: false,
        }, null, 2));
    }
    process.exit(0);
}
main();
