#!/usr/bin/env node
"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const {
  createJob,
  readJobs,
  writeJobs,
  parseFlagArgs,
  asBoolean,
  asNumber,
} = require("./nightly-lib");

function usage() {
  process.stdout.write(`
Usage:
  node scripts/nightly-enqueue.js --link <share-link> [options]

Options:
  --title <text>           Optional title hint
  --date <YYYY-MM-DD>      Optional date hint
  --sample-count <n>       Extractor sample count (default: 30)
  --download-count <n>     Download count (default: 24)
  --publish                Auto publish if checks pass
  --deploy                 Auto deploy (implies --publish)
  --overwrite-post         Allow overwrite when target post exists
  --help                   Show this help
`);
}

async function main() {
  const args = parseFlagArgs(process.argv.slice(2));

  if (args.help) {
    usage();
    return;
  }

  const link = args.link;
  if (!link || typeof link !== "string") {
    process.stderr.write("Missing required argument: --link\n");
    usage();
    process.exitCode = 1;
    return;
  }

  const job = createJob({
    link,
    titleHint: typeof args.title === "string" ? args.title : "",
    dateHint: typeof args.date === "string" ? args.date : "",
    sampleCount: asNumber(args["sample-count"], 30),
    downloadCount: asNumber(args["download-count"], 24),
    autoPublish: asBoolean(args.publish),
    autoDeploy: asBoolean(args.deploy),
    overwritePost: asBoolean(args["overwrite-post"]),
  });

  const jobs = await readJobs();
  jobs.push(job);
  await writeJobs(jobs);

  process.stdout.write(`Enqueued ${job.id}\n`);
  process.stdout.write(`Provider: ${job.source.provider}\n`);
  process.stdout.write(`Link: ${job.source.link}\n`);
  process.stdout.write(`Publish: ${job.options.autoPublish ? "yes" : "no"} | Deploy: ${job.options.autoDeploy ? "yes" : "no"}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
