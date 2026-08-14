import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const fingerprintFile = path.resolve("docs/migration/source-content-fingerprints.json");
const publicRoots = ["app", "components", "lib", "types"];
const extensions = new Set([".ts", ".tsx"]);

const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const shingles = (value, size = 3) => {
  const words = normalize(value).split(" ").filter((word) => word.length > 1);
  return new Set(words.slice(0, Math.max(words.length - size + 1, 0)).map((_, index) => words.slice(index, index + size).join(" ")));
};
const similarity = (left, right) => {
  const a = shingles(left);
  const b = shingles(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return (2 * shared) / (a.size + b.size);
};

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(item, files);
    else if (extensions.has(path.extname(item))) files.push(item);
  }
  return files;
}

let sourceRecords;
try {
  sourceRecords = JSON.parse(await readFile(fingerprintFile, "utf8"));
} catch {
  console.error("Private migration fingerprint file is required. Run pnpm audit:source-products before building.");
  process.exit(1);
}
const publicText = (await Promise.all((await Promise.all(publicRoots.map((root) => walk(path.resolve(root))))).flat().map((file) => readFile(file, "utf8")))).join("\n");
const failures = [];
for (const source of sourceRecords) {
  const titleScore = similarity(source.sourceTitle, publicText);
  const metaScore = similarity(source.sourceDescription, publicText);
  const bodyScore = similarity(source.sourceBody, publicText);
  if (titleScore > 0.82) failures.push(`Title similarity threshold exceeded for private source record (${titleScore.toFixed(2)}).`);
  if (metaScore > 0.78) failures.push(`Meta similarity threshold exceeded for private source record (${metaScore.toFixed(2)}).`);
  if (bodyScore > 0.72) failures.push(`Body similarity threshold exceeded for private source record (${bodyScore.toFixed(2)}).`);
}
if (failures.length) {
  console.error([...new Set(failures)].join("\n"));
  process.exit(1);
}
console.log("Content similarity guard passed.");
