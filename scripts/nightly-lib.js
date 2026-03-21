#!/usr/bin/env node
"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = fs.promises;
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const PIPELINE_DIR = path.join(DATA_DIR, "pipeline");
const MEDIA_HUB_DIR = path.join(DATA_DIR, "media-hub");
const ARTIFACTS_DIR = path.join(PIPELINE_DIR, "artifacts");
const JOBS_FILE = path.join(PIPELINE_DIR, "jobs.json");
const DRAFTS_DIR = path.join(ROOT_DIR, "content", "posts", "_drafts");
const SKILL_EXTRACTOR = path.join(
  process.env.HOME || "",
  ".codex/skills/create-travel-post/scripts/extract_shared_album.py",
);
const DEFAULT_EXTRACTOR = process.env.SHARE_EXTRACTOR || SKILL_EXTRACTOR;

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".avif",
  ".gif",
  ".bmp",
  ".tif",
  ".tiff",
]);

function nowIso() {
  return new Date().toISOString();
}

function toYmd(input) {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  return nowIso().slice(0, 10);
}

function detectProvider(link) {
  if (!link) return "unknown";
  const value = String(link).toLowerCase();
  if (value.includes("photos.app.goo.gl") || value.includes("photos.google.com")) {
    return "google-photos";
  }
  if (value.includes("/share/")) {
    return "immich";
  }
  return "unknown";
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_/.]+/g, "-")
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomId() {
  return crypto.randomBytes(4).toString("hex");
}

function createJobId() {
  return `job-${Date.now()}-${randomId()}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createStepState() {
  return {
    intake: { status: "queued", startedAt: null, endedAt: null, message: "" },
    mediaHub: { status: "queued", startedAt: null, endedAt: null, message: "" },
    imageCurator: { status: "queued", startedAt: null, endedAt: null, message: "" },
    writer: { status: "queued", startedAt: null, endedAt: null, message: "" },
    factChecker: { status: "queued", startedAt: null, endedAt: null, message: "" },
    publisher: { status: "queued", startedAt: null, endedAt: null, message: "" },
  };
}

function buildArtifacts(jobId) {
  const root = path.join(ARTIFACTS_DIR, jobId);
  return {
    root,
    logs: path.join(root, "run.log"),
    albumJson: path.join(root, "album.json"),
    mediaManifest: path.join(root, "media-manifest.json"),
    curationJson: path.join(root, "image-curation.json"),
    draftMdx: path.join(root, "draft.mdx"),
    factReport: path.join(root, "fact-check.md"),
    downloadsDir: path.join(root, "downloads"),
    writerNotes: path.join(root, "writer-notes.md"),
    publishBuildLog: path.join(root, "publish-build.log"),
    publishDeployLog: path.join(root, "publish-deploy.log"),
  };
}

function createJob(options) {
  const createdAt = nowIso();
  const jobId = createJobId();

  return {
    id: jobId,
    createdAt,
    updatedAt: createdAt,
    status: "queued",
    attempts: 0,
    source: {
      link: options.link,
      provider: detectProvider(options.link),
      titleHint: options.titleHint || "",
      dateHint: options.dateHint ? toYmd(options.dateHint) : "",
    },
    options: {
      sampleCount: Number.isFinite(options.sampleCount) ? options.sampleCount : 30,
      downloadCount: Number.isFinite(options.downloadCount) ? options.downloadCount : 24,
      autoPublish: Boolean(options.autoPublish),
      autoDeploy: Boolean(options.autoDeploy),
      overwritePost: Boolean(options.overwritePost),
    },
    output: {
      slug: "",
      publishPath: "",
      publicTripDir: "",
      coverImage: "",
    },
    steps: createStepState(),
    warnings: [],
    errors: [],
    artifacts: buildArtifacts(jobId),
  };
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function pathExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureRuntimeDirs() {
  await ensureDir(DATA_DIR);
  await ensureDir(PIPELINE_DIR);
  await ensureDir(MEDIA_HUB_DIR);
  await ensureDir(ARTIFACTS_DIR);
  await ensureDir(DRAFTS_DIR);
}

async function readJson(filePath, fallback) {
  if (!(await pathExists(filePath))) {
    return deepClone(fallback);
  }

  const raw = await fsp.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${error.message}`);
  }
}

async function writeJsonAtomic(filePath, value) {
  await ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.tmp-${randomId()}`;
  await fsp.writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fsp.rename(tmp, filePath);
}

async function readJobs() {
  await ensureRuntimeDirs();
  return readJson(JOBS_FILE, []);
}

async function writeJobs(jobs) {
  await writeJsonAtomic(JOBS_FILE, jobs);
}

function updateStep(job, stepName, status, message) {
  const next = {
    ...(job.steps?.[stepName] || {}),
    status,
    message: message || "",
  };

  if (status === "running") {
    next.startedAt = nowIso();
  }
  if (["completed", "failed", "skipped"].includes(status)) {
    next.endedAt = nowIso();
  }

  job.steps = { ...job.steps, [stepName]: next };
  job.updatedAt = nowIso();
}

async function appendJobLog(job, message) {
  const line = `[${nowIso()}] ${message}\n`;
  await ensureDir(job.artifacts.root);
  await fsp.appendFile(job.artifacts.logs, line, "utf8");
  process.stdout.write(`${job.id} ${message}\n`);
}

function withOverrides(baseOptions, overrides) {
  const merged = { ...baseOptions };
  if (typeof overrides.publish === "boolean") {
    merged.autoPublish = overrides.publish;
  }
  if (typeof overrides.deploy === "boolean") {
    merged.autoDeploy = overrides.deploy;
    if (overrides.deploy) {
      merged.autoPublish = true;
    }
  }
  if (typeof overrides.overwritePost === "boolean") {
    merged.overwritePost = overrides.overwritePost;
  }
  return merged;
}

function parseFlagArgs(argv) {
  const args = {
    _: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const [keyRaw, inlineValue] = token.slice(2).split("=", 2);
    const key = keyRaw.trim();
    if (!key) continue;

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

function normalizeExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return ".jpg";
  if (ext === ".jpeg") return ".jpg";
  return ext;
}

function isImageFile(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function sha1File(filePath) {
  const hash = crypto.createHash("sha1");
  const fileBuffer = await fsp.readFile(filePath);
  hash.update(fileBuffer);
  return hash.digest("hex");
}

function runCommand(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd || ROOT_DIR,
    encoding: "utf8",
    env: { ...process.env, ...(options.env || {}) },
    stdio: options.stdio || "pipe",
    shell: false,
  });

  return {
    ok: result.status === 0,
    code: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  PIPELINE_DIR,
  MEDIA_HUB_DIR,
  ARTIFACTS_DIR,
  JOBS_FILE,
  DRAFTS_DIR,
  DEFAULT_EXTRACTOR,
  createJob,
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
  detectProvider,
  toYmd,
  slugify,
  normalizeExt,
  isImageFile,
  sha1File,
  runCommand,
  nowIso,
};
