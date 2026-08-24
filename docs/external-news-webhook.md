# External News Webhook

This endpoint lets an authorized third-party publisher create a live COWIN MACHINE News article.

## Endpoint

`POST https://cowinmachine.com/api/integrations/news-publish`

Use `application/x-www-form-urlencoded` (the plugin format shown in its documentation). JSON is also accepted.

## Required configuration in Vercel

Set these Production environment variables. Do not commit their values.

- `EXTERNAL_NEWS_WEBHOOK_SECRET`: a long, random shared secret. Paste the same value into the third-party plugin's **API KEY** field.
- `EXTERNAL_NEWS_WEBHOOK_CLASS_ID`: `31`.

## Payload

| Field | Required | Notes |
| --- | --- | --- |
| `sign` | Yes | Exact shared secret. |
| `class_id` | Yes | Must be `31`. |
| `title` | Yes | 8–200 characters. |
| `content` | Yes | At least 80 characters. Basic HTML is converted to safe text/Markdown. |
| `author_id` | No | Stored only in internal quality metadata; it is not displayed as a public author claim. |
| `image_url` | No | Must be an already-authorized image hosted on `cowinmachine.com` or `www.cowinmachine.com`. External hotlinks are rejected. |

## Response

```json
{"code":1,"msg":"发布成功"}
```

Invalid credentials, a wrong category, incomplete content, or an unapproved image URL returns `{"code":0,"msg":"...具体原因..."}`.

## Publishing behavior

A successful request writes directly to the persistent News store with status `published`. It then invalidates the News list, article path, sitemap and RSS path so the new article can appear on the public News section without a code deployment.

The receiver rejects duplicate title-and-body payloads but reports them as success so the sender can retry safely.
