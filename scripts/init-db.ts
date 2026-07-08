import { db } from "../lib/db";

const sqlite = db();
const tables = sqlite.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table'").get() as { count: number };
console.log(`Database initialized with ${tables.count} tables.`);
