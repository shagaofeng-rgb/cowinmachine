import path from "node:path";
import { runSitemapJob } from "../lib/sitemap";

type CliOptions = {
  force: boolean;
  dryRun: boolean;
  submit: boolean;
  verbose: boolean;
  outputDir?: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { force: false, dryRun: false, submit: false, verbose: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--force") options.force = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--submit") options.submit = true;
    else if (arg === "--verbose") options.verbose = true;
    else if (arg === "--output-dir") options.outputDir = argv[index + 1];
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runSitemapJob({
    trigger: "manual",
    force: options.force,
    dryRun: options.dryRun,
    submit: options.submit,
    verbose: options.verbose,
    outputDir: options.outputDir ? path.resolve(options.outputDir) : undefined,
  });

  const summary = {
    ok: result.ok,
    runId: result.runId,
    trigger: result.trigger,
    urlCount: result.bundle.urlCount,
    files: result.bundle.files.map((file) => ({ name: file.name, urlCount: file.urlCount, sizeBytes: file.sizeBytes })),
    split: result.bundle.split,
    skippedCount: result.bundle.skipped.length,
    errorCount: result.bundle.errors.length,
    submittedToGoogle: result.submittedToGoogle,
    googleResult: result.googleResult,
    diff: {
      added: result.diff.added.length,
      removed: result.diff.removed.length,
      changed: result.diff.changed.length,
    },
    message: result.message,
  };

  console.log(JSON.stringify(options.verbose ? { ...summary, skipped: result.bundle.skipped, errors: result.bundle.errors } : summary, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
