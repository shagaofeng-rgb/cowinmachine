import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const inventory = read("data/product-audit/raw-product-inventory.json");
const detail = read("data/product-detail/product-detail-content.json");
const audit = read("data/product-audit/canonical-product-master.json");
const canonicalByUrl = new Map(audit.products.flatMap((item) => item.currentUrls.map((url) => [url, item])));
const profiles = new Map(detail.profiles.map((item) => [item.routeKey, item]));
const rows = inventory.records.map((record) => {
  const profile = profiles.get(`${record.category}/${record.slug}`); const canonical = canonicalByUrl.get(record.url);
  return {
    category: record.category,
    productName: record.currentH1,
    productUrl: `/products/${record.category}/${record.slug}`,
    canonicalId: canonical?.canonicalId ?? "",
    modelReference: canonical?.model ?? record.modelReference ?? "",
    pageStatus: profile?.publicationState ?? "configuration-review",
    auditStatus: canonical?.productStatus ?? "unmapped",
    reviewReason: profile?.reviewReason ?? "No profile generated.",
    imageStatus: profile?.imageStatus ?? "Image pending review",
    parameterStatus: profile?.specifications?.length ? "Captured catalog fields shown; verify before quotation" : "Request verified specifications",
  };
});
const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const headers = Object.keys(rows[0]);
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/product-detail-page-review-queue.csv"), [headers.join(","), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(","))].join("\n") + "\n");
const full = rows.filter((row) => row.pageStatus === "full-technical-content"); const review = rows.filter((row) => row.pageStatus === "configuration-review");
const duplicates = rows.filter((row) => row.auditStatus === "duplicate"); const missingImages = rows.filter((row) => row.imageStatus !== "Local catalog image available"); const missingParameters = rows.filter((row) => row.parameterStatus === "Request verified specifications");
const md = `# Product detail page reconstruction change log\n\nGenerated locally: ${new Date().toISOString()}\n\n## Scope\n\n- Rebuilt the shared dynamic product detail template at \`app/products/[category]/[slug]/page.tsx\`.\n- Added a route-to-canonical-profile dataset derived from the audit and research dossiers.\n- Added product content/evidence types, Product and Breadcrumb JSON-LD, a technical-review card, RFQ product-context prefill, and review-state rendering.\n- Updated the site contact configuration to the supplied COWIN MACHINE contact details.\n- No website deployment, production data deletion, image download, or source hotlinking was performed.\n\n## Page status\n\n| Status | Pages |\n| --- | ---: |\n| Full technical content for verified-model records | ${full.length} |\n| Request Configuration Review | ${review.length} |\n| Duplicate route records | ${duplicates.length} |\n| Missing local image | ${missingImages.length} |\n| Missing verified specifications | ${missingParameters.length} |\n\n## Publication controls\n\n- Full content is limited to canonical families marked \`verified-model\`. Captured catalog fields are shown with a configuration-review qualifier and internal-only evidence records.\n- Records with a generic family, duplicate status, potential misclassification, missing model identity, or missing specification evidence show \`Request Configuration Review\` and do not render a specification table.\n- The download CTA is intentionally replaced with \`Request Verified Specifications\` because no approved PDF is attached.\n- Product images remain local project assets only; no external image source is requested or used.\n\n## Review queue\n\nSee \`docs/product-detail-page-review-queue.csv\` for every route, canonical mapping, evidence status, image status and required next action.\n\n## Required owner inputs before expanding technical claims\n\n1. Approved model-specific manufacturer datasheet for each review-state family.\n2. Confirmation of duplicate consolidation and any category correction.\n3. Authorized image rights plus updated imagery where the supplied asset changes.\n4. Model-specific limits, test conditions, certifications, material compatibility and safety documentation where a claim is needed.\n`;
fs.writeFileSync(path.join(root, "docs/product-detail-page-change-log.md"), md);
console.log(JSON.stringify({ full: full.length, review: review.length, duplicates: duplicates.length, missingImages: missingImages.length, missingParameters: missingParameters.length }, null, 2));
