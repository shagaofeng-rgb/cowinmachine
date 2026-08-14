import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourceRoots = ["app", "components", "lib"];
const assetRoot = path.resolve("public/images/generated");
const registerFile = path.resolve("data/site-visuals/non-product-visual-register.json");
const extension = new Set([".ts", ".tsx"]);
const visualPattern = /\/images\/generated\/[^"'`\s)}]+/g;

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(item, files);
    else if (extension.has(path.extname(item))) files.push(item);
  }
  return files;
}

const sourceFiles = (await Promise.all(sourceRoots.map((root) => walk(path.resolve(root))))).flat();
const references = [];
for (const sourceFile of sourceFiles) {
  const content = await readFile(sourceFile, "utf8");
  for (const match of content.matchAll(visualPattern)) references.push({ asset: match[0], sourceFile });
}

const referencedAssets = new Map();
for (const reference of references) referencedAssets.set(reference.asset, [...(referencedAssets.get(reference.asset) ?? []), reference.sourceFile]);
const duplicateAssets = [...referencedAssets.entries()].filter(([, files]) => files.length !== 1);
if (duplicateAssets.length) {
  console.error("Each generated non-product image must be used exactly once.");
  for (const [asset, files] of duplicateAssets) console.error(`${asset}: ${files.join(", ")}`);
  process.exit(1);
}

const generatedFiles = (await readdir(assetRoot)).filter((file) => /\.(avif|jpe?g|png|webp)$/i.test(file));
const unusedAssets = generatedFiles.filter((file) => !referencedAssets.has(`/images/generated/${file}`));
const visualRegister = JSON.parse(await readFile(registerFile, "utf8"));
const registeredAssets = new Set(visualRegister.assets.map((asset) => asset.path));
const unregisteredAssets = [...referencedAssets.keys()].filter((asset) => !registeredAssets.has(asset));
const unreferencedRegisterAssets = [...registeredAssets].filter((asset) => !referencedAssets.has(asset));
const missingAssets = [];
for (const asset of referencedAssets.keys()) {
  try { await access(path.resolve("public", asset.slice(1))); }
  catch { missingAssets.push(asset); }
}
if (unusedAssets.length || missingAssets.length || unregisteredAssets.length || unreferencedRegisterAssets.length) {
  if (unusedAssets.length) console.error(`Generated images without exactly one site use: ${unusedAssets.join(", ")}`);
  if (missingAssets.length) console.error(`Referenced generated images missing from public/: ${missingAssets.join(", ")}`);
  if (unregisteredAssets.length) console.error(`Referenced generated images missing from the visual register: ${unregisteredAssets.join(", ")}`);
  if (unreferencedRegisterAssets.length) console.error(`Visual register entries without a site reference: ${unreferencedRegisterAssets.join(", ")}`);
  process.exit(1);
}

console.log(`Site visual usage guard passed: ${referencedAssets.size} generated images, each referenced exactly once.`);
