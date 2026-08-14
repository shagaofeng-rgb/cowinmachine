# Content automation environment template

Set these values only in the local scheduler or deployment environment. Do not commit a populated `.env` file.

```dotenv
# Default schedule: every two days at 08:00 in the scheduler's configured timezone.
CONTENT_SCHEDULE="0 8 */2 * *"
CONTENT_MODE="draft"
AUTO_PUBLISH="false"

# The shipped adapter writes to data/content-automation only on a local or persistent-disk host.
CONTENT_STORAGE_ADAPTER="file"

# Required for the protected scheduler endpoint and the generic scheduler client.
CONTENT_AUTOMATION_TOKEN="SET_IN_DEPLOYMENT_ONLY"
CONTENT_AUTOMATION_URL="https://YOUR-DOMAIN"

# Required before the internal management page exists. These values are server-only.
CONTENT_ADMIN_ENABLED="false"
CONTENT_ADMIN_USER="SET_IN_DEPLOYMENT_ONLY"
CONTENT_ADMIN_PASSWORD="SET_IN_DEPLOYMENT_ONLY"
CONTENT_ADMIN_ALLOW_PUBLISH="false"

# Optional future Search Console adapter. Credentials are not implemented or exposed by this repository.
GOOGLE_SEARCH_CONSOLE_PROPERTY=""
GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON=""
```

## Auto-publish enablement

Only after a durable content-store adapter, protected administration and a review process are operational, set:

```dotenv
CONTENT_MODE="publish"
AUTO_PUBLISH="true"
```

For a human-triggered publish action, also set `CONTENT_ADMIN_ALLOW_PUBLISH="true"`. The quality gate still blocks an item that fails source recency, product verification, links, image rights, similarity or SEO-structure checks.
