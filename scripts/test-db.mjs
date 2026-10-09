// Runs every supabase/tests/*.sql file against the local Supabase database
// (start it with `npm run db:start`). Works on Windows, macOS and Linux.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const container = "supabase_db_rental_marketplace";
const dir = join(import.meta.dirname, "..", "supabase", "tests");

for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  console.log(`${file}:`);
  const result = spawnSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-o", "/dev/null"],
    { input: readFileSync(join(dir, file)), stdio: ["pipe", "inherit", "inherit"] },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
