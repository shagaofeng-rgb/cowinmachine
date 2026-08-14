import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const candidates = read("data/news/source-candidates.json").candidates;
const queue = read("data/news/article-queue.json").articles;
const state = read("data/content-automation/content-state.json");
const eligible = candidates.filter((candidate) => candidate.eligibleForArticle);
const ready = queue.filter((item) => item.status === "research-ready");
if (eligible.some((candidate) => candidate.imageLicenseStatus === "licensed" && !candidate.url.startsWith("https://"))) throw new Error("Invalid source URL.");
if (ready.some((item) => item.internalLinks.length < 3 || item.requiredSources.filter((source) => source.startsWith("NEWS-")).length < 2)) throw new Error("A research-ready topic does not meet the source/link gate.");
if (state.articles.some((article) => article.status === "published" && article.discoveryStatus !== "included-in-sitemap" && article.discoveryStatus !== "discovery-pending" && article.discoveryStatus !== "crawl-status-unknown" && article.discoveryStatus !== "indexed-confirmed" && article.discoveryStatus !== "not-indexed")) throw new Error("Invalid discovery status.");
console.log(JSON.stringify({ eligibleCandidates: eligible.length, researchReadyTopics: ready.length, savedArticles: state.articles.length, result: "content-automation-data-valid" }));
