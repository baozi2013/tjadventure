#!/usr/bin/env node
"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const fsp = fs.promises;
const path = require("node:path");

const {
  ROOT_DIR,
  MEDIA_HUB_DIR,
  DRAFTS_DIR,
  DEFAULT_EXTRACTOR,
  readJobs,
  writeJobs,
  writeJsonAtomic,
  readJson,
  updateStep,
  appendJobLog,
  ensureRuntimeDirs,
  ensureDir,
  pathExists,
  withOverrides,
  parseFlagArgs,
  asNumber,
  asBoolean,
  toYmd,
  slugify,
  normalizeExt,
  isImageFile,
  sha1File,
  runCommand,
  nowIso,
} = require("./nightly-lib");

let sharp = null;
try {
  // Optional runtime dependency for better media metadata.
  sharp = require("sharp");
} catch {
  sharp = null;
}

function usage() {
  process.stdout.write(`
Usage:
  node scripts/nightly-run.js [options]

Options:
  --job-id <id>            Run one specific job
  --max-jobs <n>           Max jobs to process this run (default: 3)
  --retry-failed           Include failed jobs in selection
  --publish                Override jobs to auto publish
  --deploy                 Override jobs to auto deploy (implies publish)
  --overwrite-post         Allow overwrite when target post exists
  --help                   Show this help
`);
}

function pickAlbumItems(album) {
  if (Array.isArray(album)) return album;
  if (!album || typeof album !== "object") return [];

  const keys = [
    "items",
    "mediaItems",
    "assets",
    "photos",
    "sampledItems",
    "sample",
  ];
  for (const key of keys) {
    if (Array.isArray(album[key])) return album[key];
  }
  return [];
}

function pickItemUrl(item) {
  if (!item || typeof item !== "object") return "";
  const keys = [
    "url",
    "downloadUrl",
    "imageUrl",
    "mediaUrl",
    "baseUrl",
    "src",
    "contentUrl",
  ];
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) {
      return value.trim();
    }
  }
  return "";
}

function estimateReadTime(imageCount) {
  const words = 780 + imageCount * 35;
  const minutes = Math.max(4, Math.round(words / 260));
  return `${minutes} min`;
}

function sanitizeTitle(value, fallbackDate) {
  const clean = String(value || "").trim();
  if (clean.length > 0) return clean;
  return `旅行记录 ${fallbackDate}`;
}

async function inspectImage(filePath) {
  const stat = await fsp.stat(filePath);
  const result = {
    bytes: stat.size,
    width: null,
    height: null,
    clarityScore: null,
  };

  if (!sharp) {
    return result;
  }

  try {
    const metadata = await sharp(filePath).metadata();
    result.width = metadata.width || null;
    result.height = metadata.height || null;

    const stats = await sharp(filePath)
      .greyscale()
      .resize(160, 160, { fit: "inside", withoutEnlargement: true })
      .stats();

    const stdev = stats?.channels?.[0]?.stdev;
    if (typeof stdev === "number" && Number.isFinite(stdev)) {
      result.clarityScore = Number(stdev.toFixed(2));
    }
  } catch {
    // Ignore decode failures; keep the file in pipeline.
  }

  return result;
}

function stepSummary(stepResult) {
  if (!stepResult) return "";
  const parts = [];
  if (stepResult.message) parts.push(stepResult.message);
  if (stepResult.warning) parts.push(`warning: ${stepResult.warning}`);
  if (stepResult.error) parts.push(`error: ${stepResult.error}`);
  return parts.join(" | ");
}

async function saveJobProgress(jobs, job, message) {
  job.updatedAt = nowIso();
  if (message) {
    await appendJobLog(job, message);
  }
  await writeJobs(jobs);
}

function buildSlug(job, albumTitle) {
  const date = toYmd(job.source.dateHint || nowIso().slice(0, 10));
  const year = date.slice(0, 4);
  const titleBase = albumTitle || job.source.titleHint || `${job.source.provider}-${date}`;
  const normalized = slugify(titleBase);
  if (!normalized) {
    return `trip-${year}-${job.id.slice(-6)}`;
  }
  return `${normalized}-${year}`;
}

function buildCategory(provider) {
  if (provider === "google-photos") return "US · Family Trip";
  if (provider === "immich") return "US · Family Trip";
  return "US · Trip";
}

function buildTags(provider, slug) {
  const base = slug.split("-").filter(Boolean).slice(0, 5);
  const tags = new Set(base);
  tags.add("travel-journal");
  if (provider === "google-photos") tags.add("google-photos");
  if (provider === "immich") tags.add("immich");
  return Array.from(tags).slice(0, 7);
}

function buildDraftMdx({
  title,
  excerpt,
  date,
  category,
  readTime,
  coverImage,
  tags,
  summaryLine,
  images,
  sourceLink,
}) {
  const imageLines = images
    .map((image, index) => `![旅途照片 ${index + 1}](${image})`)
    .join("\n");

  const tagLines = tags.map((tag) => `  - ${tag}`).join("\n");

  return `---
title: "${title}"
excerpt: "${excerpt}"
date: "${date}"
category: "${category}"
readTime: "${readTime}"
coverImage: "${coverImage}"
tags:
${tagLines}
---

## 行程概览

${summaryLine}

素材来源：${sourceLink}

## 旅途照片

${imageLines || "[待补充：照片未下载成功，请后续补图]"}

## 小结

1. 这是一版自动草稿，已按素材顺序生成基础结构。
2. 建议补充当天路线、停车、餐饮和亲子体验细节。
3. 发布前请复核地名、人名与时间点。
`;
}

function collectMdxImagePaths(content) {
  const images = [];
  const pattern = /!\[[^\]]*]\(([^)]+)\)/g;
  let match = pattern.exec(content);
  while (match) {
    images.push(match[1]);
    match = pattern.exec(content);
  }
  return images;
}

function parseFrontmatterKeys(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return new Set();

  const keys = new Set();
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("-")) continue;
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    keys.add(line.slice(0, idx).trim());
  }
  return keys;
}

async function runIntake(job) {
  await ensureDir(job.artifacts.root);
  await ensureDir(job.artifacts.downloadsDir);

  const fallbackAlbum = {
    provider: job.source.provider,
    title: job.source.titleHint || "",
    sourceLink: job.source.link,
    dateHint: job.source.dateHint || "",
    items: [],
  };

  if (!(await pathExists(DEFAULT_EXTRACTOR))) {
    await writeJsonAtomic(job.artifacts.albumJson, fallbackAlbum);
    return {
      ok: true,
      warning: `extractor not found at ${DEFAULT_EXTRACTOR}; wrote fallback album.json`,
    };
  }

  const result = runCommand("python3", [
    DEFAULT_EXTRACTOR,
    job.source.link,
    "--sample-count",
    String(job.options.sampleCount || 30),
    "--download-dir",
    job.artifacts.downloadsDir,
    "--download-count",
    String(job.options.downloadCount || 24),
    "--output",
    job.artifacts.albumJson,
  ]);

  if (!result.ok) {
    await writeJsonAtomic(job.artifacts.albumJson, fallbackAlbum);
    return {
      ok: true,
      warning: `extractor failed (${result.code}); fallback album.json written`,
      debug: `${result.stdout}\n${result.stderr}`.trim(),
    };
  }

  return { ok: true, message: "album metadata extracted" };
}

async function runMediaHub(job) {
  const album = await readJson(job.artifacts.albumJson, {
    title: "",
    items: [],
  });

  const albumTitle = String(album.title || "").trim();
  if (!job.output.slug) {
    job.output.slug = buildSlug(job, albumTitle);
  }

  const publicTripDir = path.join(ROOT_DIR, "public", "trips", job.output.slug);
  await ensureDir(publicTripDir);
  job.output.publicTripDir = publicTripDir;

  const rawEntries = await fsp.readdir(job.artifacts.downloadsDir, {
    withFileTypes: true,
  }).catch(() => []);
  const downloaded = rawEntries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(job.artifacts.downloadsDir, entry.name))
    .filter((filePath) => isImageFile(filePath))
    .sort((a, b) => a.localeCompare(b));

  const localAssets = [];
  for (let index = 0; index < downloaded.length; index += 1) {
    const sourcePath = downloaded[index];
    const ext = normalizeExt(sourcePath);
    const fileName = `day1-${index + 1}${ext}`;
    const destinationPath = path.join(publicTripDir, fileName);
    await fsp.copyFile(sourcePath, destinationPath);

    const meta = await inspectImage(destinationPath);
    localAssets.push({
      id: `local-${index + 1}`,
      kind: "local",
      sourcePath,
      publicPath: `/trips/${job.output.slug}/${fileName}`,
      bytes: meta.bytes,
      width: meta.width,
      height: meta.height,
      clarityScore: meta.clarityScore,
      hashSha1: await sha1File(destinationPath),
    });
  }

  const remoteAssets = [];
  if (localAssets.length === 0) {
    const items = pickAlbumItems(album);
    let remoteIndex = 1;
    for (const item of items) {
      const url = pickItemUrl(item);
      if (!url) continue;
      remoteAssets.push({
        id: `remote-${remoteIndex}`,
        kind: "remote",
        publicPath: url,
        bytes: null,
        width: null,
        height: null,
        clarityScore: null,
        hashSha1: "",
      });
      remoteIndex += 1;
    }
  }

  const assets = localAssets.length > 0 ? localAssets : remoteAssets;

  const manifest = {
    generatedAt: nowIso(),
    jobId: job.id,
    slug: job.output.slug,
    provider: job.source.provider,
    sourceLink: job.source.link,
    assets,
  };

  await writeJsonAtomic(job.artifacts.mediaManifest, manifest);
  await writeJsonAtomic(path.join(MEDIA_HUB_DIR, `${job.output.slug}.json`), manifest);

  const hubIndexPath = path.join(MEDIA_HUB_DIR, "index.json");
  const hubIndex = await readJson(hubIndexPath, { updatedAt: "", trips: {} });
  hubIndex.updatedAt = nowIso();
  hubIndex.trips[job.output.slug] = {
    updatedAt: nowIso(),
    jobId: job.id,
    sourceLink: job.source.link,
    assetCount: assets.length,
    localAssetCount: localAssets.length,
  };
  await writeJsonAtomic(hubIndexPath, hubIndex);

  return {
    ok: true,
    message: `manifest created with ${assets.length} assets (${localAssets.length} local)`,
    assets,
  };
}

async function runImageCurator(job, mediaResult) {
  const assets = Array.isArray(mediaResult.assets) ? mediaResult.assets : [];
  const ranked = [...assets].sort((a, b) => {
    const scoreA = typeof a.clarityScore === "number" ? a.clarityScore : 0;
    const scoreB = typeof b.clarityScore === "number" ? b.clarityScore : 0;
    if (scoreA !== scoreB) return scoreB - scoreA;

    const bytesA = typeof a.bytes === "number" ? a.bytes : 0;
    const bytesB = typeof b.bytes === "number" ? b.bytes : 0;
    return bytesB - bytesA;
  });

  const selected = ranked.slice(0, 18);
  const cover = selected[0]?.publicPath || `/trips/${job.output.slug}/day1-1.jpg`;
  job.output.coverImage = cover;

  const curation = {
    generatedAt: nowIso(),
    jobId: job.id,
    slug: job.output.slug,
    coverImage: cover,
    selectedImageCount: selected.length,
    selectedImages: selected.map((asset, index) => ({
      order: index + 1,
      path: asset.publicPath,
      clarityScore: asset.clarityScore,
      caption: `旅途照片 ${index + 1}`,
    })),
  };

  await writeJsonAtomic(job.artifacts.curationJson, curation);
  return {
    ok: true,
    message: `selected ${selected.length} images, cover=${cover}`,
    curation,
  };
}

async function runWriter(job, curationResult) {
  const curation = curationResult.curation || { selectedImages: [] };
  const date = toYmd(job.source.dateHint || nowIso().slice(0, 10));
  const title = sanitizeTitle(job.source.titleHint, date);
  const category = buildCategory(job.source.provider);
  const selectedPaths = curation.selectedImages.map((item) => item.path);
  const coverImage = curation.coverImage || selectedPaths[0] || "";
  const tags = buildTags(job.source.provider, job.output.slug);
  const excerpt = `这是一篇由夜间流水线生成的草稿，基于 ${selectedPaths.length} 张素材图自动整理。`;
  const summaryLine = `本次行程已自动完成基础整理，当前版本重点完成了图片顺序与结构化段落。`;
  const readTime = estimateReadTime(selectedPaths.length);

  const mdx = buildDraftMdx({
    title,
    excerpt,
    date,
    category,
    readTime,
    coverImage,
    tags,
    summaryLine,
    images: selectedPaths,
    sourceLink: job.source.link,
  });

  await fsp.writeFile(job.artifacts.draftMdx, mdx, "utf8");

  const draftPath = path.join(DRAFTS_DIR, `${job.output.slug}.mdx`);
  await ensureDir(path.dirname(draftPath));
  await fsp.writeFile(draftPath, mdx, "utf8");

  job.output.publishPath = path.join(ROOT_DIR, "content", "posts", `${job.output.slug}.mdx`);

  const notes = [
    `# Writer Notes`,
    ``,
    `- slug: ${job.output.slug}`,
    `- draft: ${draftPath}`,
    `- source: ${job.source.link}`,
    `- selected images: ${selectedPaths.length}`,
  ].join("\n");
  await fsp.writeFile(job.artifacts.writerNotes, notes, "utf8");

  return {
    ok: true,
    message: `draft written: ${draftPath}`,
    draftPath,
  };
}

async function runFactChecker(job, writerResult) {
  const draftPath = writerResult.draftPath;
  const content = await fsp.readFile(draftPath, "utf8");

  const requiredKeys = ["title", "excerpt", "date", "category", "readTime", "coverImage", "tags"];
  const presentKeys = parseFrontmatterKeys(content);
  const missingKeys = requiredKeys.filter((key) => !presentKeys.has(key));

  const imagePaths = collectMdxImagePaths(content);
  const missingLocalImages = [];

  for (const imagePath of imagePaths) {
    if (!imagePath.startsWith("/")) continue;
    const absolute = path.join(ROOT_DIR, "public", imagePath.replace(/^\/+/, ""));
    if (!(await pathExists(absolute))) {
      missingLocalImages.push(imagePath);
    }
  }

  const pass = missingKeys.length === 0 && missingLocalImages.length === 0;

  const reportLines = [
    "# Fact Check Report",
    ``,
    `- job: ${job.id}`,
    `- slug: ${job.output.slug}`,
    `- generatedAt: ${nowIso()}`,
    `- gate: ${pass ? "PASS" : "FAIL"}`,
    ``,
    "## Missing Frontmatter Keys",
    missingKeys.length ? missingKeys.map((key) => `- ${key}`).join("\n") : "- none",
    ``,
    "## Missing Local Images",
    missingLocalImages.length ? missingLocalImages.map((item) => `- ${item}`).join("\n") : "- none",
    ``,
    "## Notes",
    "- This check validates schema and local file resolution.",
    "- It does not validate travel facts against external sources yet.",
    "",
  ];
  await fsp.writeFile(job.artifacts.factReport, reportLines.join("\n"), "utf8");

  return {
    ok: true,
    message: pass ? "fact-check gate passed" : "fact-check found issues",
    pass,
    missingKeys,
    missingLocalImages,
  };
}

async function runPublisher(job, factResult, options) {
  const enablePublish = options.autoPublish;
  const enableDeploy = options.autoDeploy;

  if (!enablePublish) {
    return { ok: true, skipped: true, message: "publish disabled for this run" };
  }

  if (!factResult.pass) {
    return {
      ok: false,
      message: "publish blocked: fact-check gate failed",
    };
  }

  const draftPath = path.join(DRAFTS_DIR, `${job.output.slug}.mdx`);
  const publishPath = job.output.publishPath;
  await ensureDir(path.dirname(publishPath));

  if ((await pathExists(publishPath)) && !options.overwritePost) {
    return {
      ok: false,
      message: `target post exists: ${publishPath} (pass --overwrite-post to replace)`,
    };
  }

  await fsp.copyFile(draftPath, publishPath);

  const buildResult = runCommand("npm", ["run", "build"]);
  await fsp.writeFile(
    job.artifacts.publishBuildLog,
    `${buildResult.stdout}\n${buildResult.stderr}`.trim(),
    "utf8",
  );

  if (!buildResult.ok) {
    return {
      ok: false,
      message: `npm run build failed with code ${buildResult.code}`,
    };
  }

  if (!enableDeploy) {
    return { ok: true, message: `published ${publishPath} (deploy disabled)` };
  }

  const deployResult = runCommand("./scripts/deploy-nas.sh", []);
  await fsp.writeFile(
    job.artifacts.publishDeployLog,
    `${deployResult.stdout}\n${deployResult.stderr}`.trim(),
    "utf8",
  );

  if (!deployResult.ok) {
    return { ok: false, message: `deploy failed with code ${deployResult.code}` };
  }

  return { ok: true, message: `published and deployed ${job.output.slug}` };
}

async function processJob(jobs, job, overrides) {
  job.status = "running";
  job.attempts = (job.attempts || 0) + 1;
  await saveJobProgress(jobs, job, "job started");

  const effectiveOptions = withOverrides(job.options, overrides);
  job.options = effectiveOptions;

  updateStep(job, "intake", "running", "extracting album");
  await saveJobProgress(jobs, job, "step intake running");
  const intakeResult = await runIntake(job);
  updateStep(job, "intake", "completed", stepSummary(intakeResult));
  if (intakeResult.warning) job.warnings.push(intakeResult.warning);
  await saveJobProgress(jobs, job, "step intake completed");

  updateStep(job, "mediaHub", "running", "building media manifest");
  await saveJobProgress(jobs, job, "step mediaHub running");
  const mediaResult = await runMediaHub(job);
  if (!mediaResult.ok) {
    updateStep(job, "mediaHub", "failed", stepSummary(mediaResult));
    job.errors.push(mediaResult.error || mediaResult.message || "mediaHub failed");
    job.status = "failed";
    await saveJobProgress(jobs, job, "step mediaHub failed");
    return;
  }
  updateStep(job, "mediaHub", "completed", stepSummary(mediaResult));
  await saveJobProgress(jobs, job, "step mediaHub completed");

  updateStep(job, "imageCurator", "running", "ranking and selecting images");
  await saveJobProgress(jobs, job, "step imageCurator running");
  const curationResult = await runImageCurator(job, mediaResult);
  updateStep(job, "imageCurator", "completed", stepSummary(curationResult));
  await saveJobProgress(jobs, job, "step imageCurator completed");

  updateStep(job, "writer", "running", "writing draft mdx");
  await saveJobProgress(jobs, job, "step writer running");
  const writerResult = await runWriter(job, curationResult);
  if (!writerResult.ok) {
    updateStep(job, "writer", "failed", stepSummary(writerResult));
    job.errors.push(writerResult.error || writerResult.message || "writer failed");
    job.status = "failed";
    await saveJobProgress(jobs, job, "step writer failed");
    return;
  }
  updateStep(job, "writer", "completed", stepSummary(writerResult));
  await saveJobProgress(jobs, job, "step writer completed");

  updateStep(job, "factChecker", "running", "validating draft schema and image paths");
  await saveJobProgress(jobs, job, "step factChecker running");
  const factResult = await runFactChecker(job, writerResult);
  updateStep(job, "factChecker", "completed", stepSummary(factResult));
  if (!factResult.pass) {
    job.warnings.push("Fact-check gate failed. Review fact-check.md before publishing.");
  }
  await saveJobProgress(jobs, job, "step factChecker completed");

  updateStep(job, "publisher", "running", "publish/deploy gate");
  await saveJobProgress(jobs, job, "step publisher running");
  const publishResult = await runPublisher(job, factResult, effectiveOptions);

  if (!publishResult.ok) {
    updateStep(job, "publisher", "failed", stepSummary(publishResult));
    job.errors.push(publishResult.message || "publisher failed");
    job.status = "failed";
    await saveJobProgress(jobs, job, "step publisher failed");
    return;
  }

  const publishStatus = publishResult.skipped ? "skipped" : "completed";
  updateStep(job, "publisher", publishStatus, stepSummary(publishResult));
  job.status = "completed";
  await saveJobProgress(jobs, job, "job completed");
}

async function main() {
  const args = parseFlagArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  await ensureRuntimeDirs();

  const maxJobs = asNumber(args["max-jobs"], 3);
  const targetJobId = typeof args["job-id"] === "string" ? args["job-id"] : "";
  const retryFailed = asBoolean(args["retry-failed"]);
  const overrides = {
    publish: args.publish === true ? true : undefined,
    deploy: args.deploy === true ? true : undefined,
    overwritePost: args["overwrite-post"] === true ? true : undefined,
  };

  const jobs = await readJobs();
  const selected = jobs
    .filter((job) => {
      if (targetJobId && job.id !== targetJobId) return false;
      if (job.status === "queued") return true;
      if (retryFailed && job.status === "failed") return true;
      return false;
    })
    .slice(0, Math.max(1, maxJobs));

  if (selected.length === 0) {
    process.stdout.write("No jobs to run.\n");
    return;
  }

  for (const targetJob of selected) {
    const index = jobs.findIndex((job) => job.id === targetJob.id);
    if (index < 0) continue;
    const job = jobs[index];

    try {
      await processJob(jobs, job, overrides);
    } catch (error) {
      job.status = "failed";
      job.errors.push(error.message);
      updateStep(job, "publisher", "failed", "pipeline crashed");
      await appendJobLog(job, `fatal error: ${error.stack || error.message}`);
      await writeJobs(jobs);
    }
  }

  const summary = jobs
    .filter((job) => selected.some((item) => item.id === job.id))
    .map((job) => `${job.id} -> ${job.status}`)
    .join("\n");

  process.stdout.write(`${summary}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
