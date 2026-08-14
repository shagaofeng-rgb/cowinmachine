import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "components", "lib", "public", "types"];
const textFromCodes = (...codes) => String.fromCharCode(...codes);
const spacedPhone = (...codes) => codes.map((code) => `${String.fromCharCode(code).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`).join("");
const forbidden = [
  new RegExp(textFromCodes(117, 110, 105, 118, 116, 111, 119, 101, 114), "gi"),
  new RegExp(textFromCodes(109, 111, 100, 101, 114, 97, 116, 101, 109, 97, 99, 104, 105, 110, 101), "gi"),
  new RegExp(`${textFromCodes(113, 117, 122, 104, 111, 117)}\\s+${textFromCodes(122, 104, 111, 110, 103, 100, 117)}`, "gi"),
  new RegExp(textFromCodes(120, 105, 97, 64, 109, 111, 100, 101, 114, 97, 116, 101, 109, 97, 99, 104, 105, 110, 101, 46, 99, 111, 109), "gi"),
  new RegExp(textFromCodes(99, 111, 119, 105, 110, 109, 97, 103, 110, 101, 116, 46, 99, 111, 109), "gi"),
  new RegExp(`${textFromCodes(99, 111, 119, 105, 110)}\\s+${textFromCodes(109, 97, 103, 110, 101, 116)}`, "gi"),
  new RegExp(`${textFromCodes(113, 117, 122, 104, 111, 117)}\\s+${textFromCodes(113, 105, 121, 105, 110, 103)}`, "gi"),
  new RegExp(`${textFromCodes(102, 97, 99, 116, 111, 114, 121)}\\s+${textFromCodes(105, 110)}\\s+${textFromCodes(122, 104, 101, 106, 105, 97, 110, 103)}`, "gi"),
  new RegExp(spacedPhone(43, 56, 54, 49, 53, 54, 54, 53, 49, 51, 53, 50, 48, 53), "g"),
  new RegExp(spacedPhone(43, 56, 54, 49, 54, 54, 53, 55, 48, 48, 48, 48, 50), "g"),
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
  // The supplied COWIN MACHINE contact email uses this domain; remove only the exact
  // approved address before scanning so other legacy references remain blocked.
  const text = (await readFile(file, "utf8"))
    .replaceAll("davidsha@cowinmagnet.com", "approved-contact@example.com")
    .replaceAll("+86 156 6513 5205", "approved-phone")
    .replaceAll("+8615665135205", "approved-whatsapp");
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
