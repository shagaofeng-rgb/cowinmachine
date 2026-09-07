import "server-only";

import { randomUUID } from "node:crypto";
import { isNewsDatabaseConfigured, newsSql } from "@/lib/content-automation/database";

export type BlogWebhookEventStatus =
  | "validation"
  | "published"
  | "duplicate"
  | "rejected"
  | "failed";

export type BlogWebhookImageStatus =
  | "none"
  | "local-authorized"
  | "external-omitted"
  | "invalid";

export type BlogWebhookEvent = {
  id: string;
  occurredAt: string;
  endpoint: string;
  channel: "blog";
  status: BlogWebhookEventStatus;
  classId: string | null;
  titleLength: number;
  contentLength: number;
  imageStatus: BlogWebhookImageStatus;
  reason: string | null;
  articleId: string | null;
  requestId: string;
};

type RecordEventInput = Omit<BlogWebhookEvent, "id" | "occurredAt"> & {
  id?: string;
  occurredAt?: string;
};

export async function recordBlogWebhookEvent(input: RecordEventInput) {
  if (!isNewsDatabaseConfigured()) return false;

  const event: BlogWebhookEvent = {
    id: input.id ?? randomUUID(),
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    ...input,
  };

  await newsSql().query(
    `INSERT INTO inbound_blog_webhook_events
      (id, occurred_at, endpoint, channel, status, class_id, title_length, content_length, image_status, reason, article_id, request_id)
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::uuid, $12)`,
    [
      event.id,
      event.occurredAt,
      event.endpoint,
      event.channel,
      event.status,
      event.classId,
      event.titleLength,
      event.contentLength,
      event.imageStatus,
      event.reason,
      event.articleId,
      event.requestId,
    ],
  );

  return true;
}

export async function getRecentBlogWebhookEvents(limit = 20): Promise<BlogWebhookEvent[]> {
  if (!isNewsDatabaseConfigured()) return [];

  const rows = await newsSql().query(
    `SELECT id, occurred_at, endpoint, channel, status, class_id, title_length, content_length, image_status, reason, article_id, request_id
       FROM inbound_blog_webhook_events
       ORDER BY occurred_at DESC
       LIMIT $1`,
    [Math.min(Math.max(limit, 1), 100)],
  );

  return rows.map((row) => ({
    id: String(row.id),
    occurredAt: new Date(String(row.occurred_at)).toISOString(),
    endpoint: String(row.endpoint),
    channel: "blog",
    status: String(row.status) as BlogWebhookEventStatus,
    classId: row.class_id ? String(row.class_id) : null,
    titleLength: Number(row.title_length),
    contentLength: Number(row.content_length),
    imageStatus: String(row.image_status) as BlogWebhookImageStatus,
    reason: row.reason ? String(row.reason) : null,
    articleId: row.article_id ? String(row.article_id) : null,
    requestId: String(row.request_id),
  }));
}
