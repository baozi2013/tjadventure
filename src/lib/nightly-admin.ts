import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const fsp = fs.promises;

export const NIGHTLY_ROOT = process.cwd();
export const NIGHTLY_DATA_DIR = path.join(NIGHTLY_ROOT, "data");
export const NIGHTLY_PIPELINE_DIR = path.join(NIGHTLY_DATA_DIR, "pipeline");
export const NIGHTLY_JOBS_PATH = path.join(NIGHTLY_PIPELINE_DIR, "jobs.json");
export const NIGHTLY_MEDIA_HUB_DIR = path.join(NIGHTLY_DATA_DIR, "media-hub");
export const NIGHTLY_HUB_INDEX_PATH = path.join(NIGHTLY_MEDIA_HUB_DIR, "index.json");
export const NIGHTLY_ARTIFACTS_DIR = path.join(NIGHTLY_PIPELINE_DIR, "artifacts");

const READ_ONLY_RUNTIME_REASON =
  "Current runtime is read-only (e.g. Vercel serverless). Local pipeline file writes and detached workers are unavailable.";

type StepStatus = "queued" | "running" | "completed" | "failed" | "skipped";

export type JobStep = {
  status: StepStatus;
  startedAt: string | null;
  endedAt: string | null;
  message: string;
};

export type NightlyJob = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "queued" | "running" | "completed" | "failed";
  attempts: number;
  source: {
    link: string;
    provider: string;
    titleHint: string;
    dateHint: string;
  };
  options: {
    sampleCount: number;
    downloadCount: number;
    autoPublish: boolean;
    autoDeploy: boolean;
    overwritePost: boolean;
  };
  output: {
    slug: string;
    publishPath: string;
    publicTripDir: string;
    coverImage: string;
  };
  steps: Record<string, JobStep>;
  warnings: string[];
  errors: string[];
  artifacts: {
    root: string;
    logs: string;
    albumJson: string;
    mediaManifest: string;
    curationJson: string;
    draftMdx: string;
    factReport: string;
    downloadsDir: string;
    writerNotes: string;
    publishBuildLog: string;
    publishDeployLog: string;
  };
};

export type HubIndex = {
  updatedAt: string;
  trips: Record<
    string,
    {
      updatedAt: string;
      jobId: string;
      sourceLink: string;
      assetCount: number;
      acceptedAssetCount?: number;
      newAssetCount?: number;
      reusedAssetCount?: number;
      skippedDuplicateCount?: number;
    }
  >;
};

export type PipelineRuntimeSupport = {
  readOnly: boolean;
  reason: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

async function ensureNightlyDirs() {
  await fsp.mkdir(NIGHTLY_ARTIFACTS_DIR, { recursive: true });
  await fsp.mkdir(NIGHTLY_MEDIA_HUB_DIR, { recursive: true });
}

function isReadOnlyRuntime() {
  // Vercel serverless runtime does not allow arbitrary writes under process.cwd().
  return process.env.VERCEL === "1";
}

export function getPipelineRuntimeSupport(): PipelineRuntimeSupport {
  if (isReadOnlyRuntime()) {
    return { readOnly: true, reason: READ_ONLY_RUNTIME_REASON };
  }
  return { readOnly: false, reason: null };
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function readJobs(): Promise<NightlyJob[]> {
  // Keep reads resilient on read-only runtimes.
  return readJson<NightlyJob[]>(NIGHTLY_JOBS_PATH, []);
}

export async function writeJobs(jobs: NightlyJob[]) {
  await writeJson(NIGHTLY_JOBS_PATH, jobs);
}

export async function readHubIndex(): Promise<HubIndex> {
  // Keep reads resilient on read-only runtimes.
  return readJson<HubIndex>(NIGHTLY_HUB_INDEX_PATH, { updatedAt: "", trips: {} });
}

export async function readJobLog(job: NightlyJob, maxLines = 80) {
  try {
    const raw = await fsp.readFile(job.artifacts.logs, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    return lines.slice(-Math.max(1, maxLines));
  } catch {
    return [];
  }
}

function resetSteps(steps: Record<string, JobStep>): Record<string, JobStep> {
  const next: Record<string, JobStep> = {};
  for (const [name, step] of Object.entries(steps || {})) {
    next[name] = {
      status: "queued",
      startedAt: null,
      endedAt: null,
      message: step?.message ? `reset at ${nowIso()}` : "",
    };
  }
  return next;
}

export async function requeueJob(jobId: string) {
  if (isReadOnlyRuntime()) {
    return { ok: false, message: READ_ONLY_RUNTIME_REASON };
  }

  await ensureNightlyDirs();
  const jobs = await readJobs();
  const index = jobs.findIndex((job) => job.id === jobId);
  if (index < 0) {
    return { ok: false, message: `Job not found: ${jobId}` };
  }

  const current = jobs[index];
  jobs[index] = {
    ...current,
    status: "queued",
    updatedAt: nowIso(),
    warnings: [],
    errors: [],
    steps: resetSteps(current.steps || {}),
  };
  await writeJobs(jobs);
  return { ok: true, message: `Requeued ${jobId}` };
}

function toArgs(data: Record<string, string | number | boolean | undefined>) {
  const args: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === false) continue;
    const flag = `--${key}`;
    if (value === true) {
      args.push(flag);
      continue;
    }
    args.push(flag, String(value));
  }
  return args;
}

export function runScriptSync(scriptName: string, args: string[] = []) {
  if (isReadOnlyRuntime()) {
    return {
      ok: false,
      code: 1,
      stdout: "",
      stderr: READ_ONLY_RUNTIME_REASON,
    };
  }

  const scriptPath = path.join(NIGHTLY_ROOT, "scripts", scriptName);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: NIGHTLY_ROOT,
    encoding: "utf8",
  });
  return {
    ok: result.status === 0,
    code: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

export function runNightlyEnqueueSync(params: {
  link: string;
  title?: string;
  date?: string;
  sampleCount?: number;
  downloadCount?: number;
  publish?: boolean;
  deploy?: boolean;
  overwritePost?: boolean;
}) {
  const args = toArgs({
    link: params.link,
    title: params.title,
    date: params.date,
    "sample-count": params.sampleCount,
    "download-count": params.downloadCount,
    publish: params.publish,
    deploy: params.deploy,
    "overwrite-post": params.overwritePost,
  });
  return runScriptSync("nightly-enqueue.js", args);
}

export function runNightlyWorkerDetached(params: {
  jobId?: string;
  maxJobs?: number;
  retryFailed?: boolean;
  publish?: boolean;
  deploy?: boolean;
  overwritePost?: boolean;
}) {
  if (isReadOnlyRuntime()) {
    return {
      ok: false,
      pid: 0,
      message: READ_ONLY_RUNTIME_REASON,
    };
  }

  const scriptPath = path.join(NIGHTLY_ROOT, "scripts", "nightly-run.js");
  const args = toArgs({
    "job-id": params.jobId,
    "max-jobs": params.maxJobs,
    "retry-failed": params.retryFailed,
    publish: params.publish,
    deploy: params.deploy,
    "overwrite-post": params.overwritePost,
  });

  const child = spawn(process.execPath, [scriptPath, ...args], {
    cwd: NIGHTLY_ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  return {
    ok: true,
    pid: child.pid,
    message: "",
  };
}
