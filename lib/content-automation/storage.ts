import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { ContentArticle, ContentAutomationState } from "@/types/content-automation";

const statePath = path.join(process.cwd(), "data", "content-automation", "content-state.json");
const emptyState = (): ContentAutomationState => ({ version: 1, articles: [], runs: [] });

export type ContentStore = {
  read(): Promise<ContentAutomationState>;
  write(state: ContentAutomationState): Promise<void>;
};

export class FileContentStore implements ContentStore {
  async read() {
    try {
      return JSON.parse(await fs.readFile(statePath, "utf8")) as ContentAutomationState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
      throw error;
    }
  }

  async write(state: ContentAutomationState) {
    if (process.env.VERCEL === "1") {
      throw new Error("File content storage is not persistent in this serverless deployment. Configure a durable content-store adapter before enabling scheduled writes.");
    }
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    const temporary = `${statePath}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    await fs.rename(temporary, statePath);
  }
}

export function contentStore(): ContentStore {
  if ((process.env.CONTENT_STORAGE_ADAPTER ?? "file") !== "file") {
    throw new Error("No configured durable content-store adapter. The shipped file adapter is for local or persistent-disk self-hosting only.");
  }
  return new FileContentStore();
}

export async function getPublishedArticles(): Promise<ContentArticle[]> {
  const state = await contentStore().read();
  return state.articles.filter((article) => article.status === "published").sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}
