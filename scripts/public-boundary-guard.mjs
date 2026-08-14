import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "components", "lib", "public", "types"];
const forbidden = [
  new RegExp(["univ", "tower"].join(""), "gi"),
  new RegExp(["cowin", "magnet\\.com"].join(""), "gi"),
  new RegExp(["cowin", "\\s+magnet"].join(""), "gi"),
  new RegExp(["quzhou", "\\s+qiying"].join(""), "gi"),
  new RegExp(["factory", "\\s+in\\s+zhejiang"].join(""), "gi"),
  /\+86\s*156\s*6513\s*5205/g,
];
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".html", ".txt", ".svg"]);
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(item);
    else if (allowedExtensions.has(path.extname(entry.name))) files.push(item);
  }
}

for (const root of roots) await walk(path.resolve(root));
const failures = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const pattern of forbidden) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) failures.push(`${path.relative(process.cwd(), file)} contains prohibited legacy/source content.`);
  }
}
if (failures.length) {
  console.error([...new Set(failures)].join("\n"));
  process.exit(1);
}
console.log("Public boundary guard passed.");
