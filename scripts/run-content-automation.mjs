const siteUrl = process.env.CONTENT_AUTOMATION_URL;
const token = process.env.CONTENT_AUTOMATION_TOKEN ?? process.env.CRON_SECRET;
if (!siteUrl || !token) throw new Error("Set CONTENT_AUTOMATION_URL and CONTENT_AUTOMATION_TOKEN (or CRON_SECRET) in the scheduler environment.");
const endpoint = new URL("/api/content-automation/run", siteUrl);
if (process.argv.includes("--dry-run")) endpoint.searchParams.set("dryRun", "true");
const response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } });
const body = await response.text();
if (!response.ok) throw new Error(`Scheduler request failed (${response.status}): ${body}`);
console.log(body);
