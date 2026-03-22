import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  readHubIndex,
  readJobLog,
  readJobs,
  requeueJob,
  runNightlyEnqueueSync,
  runNightlyWorkerDetached,
  type NightlyJob,
} from "@/lib/nightly-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParamsInput = Record<string, string | string[] | undefined>;

function single(input: string | string[] | undefined) {
  if (Array.isArray(input)) return input[0] || "";
  return input || "";
}

function boolFromForm(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "on" || normalized === "true" || normalized === "1";
}

function numberFromForm(value: FormDataEntryValue | null, fallback: number) {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function encodeMessage(level: "ok" | "error", message: string) {
  return `/admin/pipeline?level=${encodeURIComponent(level)}&msg=${encodeURIComponent(message)}`;
}

function statusClass(status: string) {
  if (status === "completed") return "border-emerald-500/40 bg-emerald-50 text-emerald-700";
  if (status === "running") return "border-sky-500/40 bg-sky-50 text-sky-700";
  if (status === "failed") return "border-rose-500/40 bg-rose-50 text-rose-700";
  if (status === "skipped") return "border-neutral-400/40 bg-neutral-100 text-neutral-700";
  return "border-amber-500/40 bg-amber-50 text-amber-700";
}

function renderTime(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace("T", " ").replace("Z", "");
}

async function enqueueAction(formData: FormData) {
  "use server";

  const link = String(formData.get("link") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "").trim();
  if (!link) {
    redirect(encodeMessage("error", "Missing shareable link."));
  }

  const result = runNightlyEnqueueSync({
    link,
    title: title || undefined,
    date: date || undefined,
    sampleCount: numberFromForm(formData.get("sampleCount"), 30),
    downloadCount: numberFromForm(formData.get("downloadCount"), 24),
    publish: boolFromForm(formData.get("publish")),
    deploy: boolFromForm(formData.get("deploy")),
    overwritePost: boolFromForm(formData.get("overwritePost")),
  });

  if (!result.ok) {
    redirect(encodeMessage("error", `enqueue failed: ${result.stderr || result.stdout || result.code}`));
  }

  revalidatePath("/admin/pipeline");
  redirect(encodeMessage("ok", "Job enqueued."));
}

async function runWorkerAction(formData: FormData) {
  "use server";
  const maxJobs = numberFromForm(formData.get("maxJobs"), 3);
  runNightlyWorkerDetached({
    maxJobs,
    retryFailed: boolFromForm(formData.get("retryFailed")),
    publish: boolFromForm(formData.get("publish")),
    deploy: boolFromForm(formData.get("deploy")),
    overwritePost: boolFromForm(formData.get("overwritePost")),
  });

  revalidatePath("/admin/pipeline");
  redirect(encodeMessage("ok", "Worker started in background."));
}

async function requeueAction(formData: FormData) {
  "use server";
  const jobId = String(formData.get("jobId") || "").trim();
  if (!jobId) {
    redirect(encodeMessage("error", "Missing job id."));
  }

  const result = await requeueJob(jobId);
  if (!result.ok) {
    redirect(encodeMessage("error", result.message));
  }
  revalidatePath("/admin/pipeline");
  redirect(encodeMessage("ok", `Requeued ${jobId}.`));
}

async function rerunJobAction(formData: FormData) {
  "use server";
  const jobId = String(formData.get("jobId") || "").trim();
  if (!jobId) {
    redirect(encodeMessage("error", "Missing job id."));
  }

  const requeueResult = await requeueJob(jobId);
  if (!requeueResult.ok) {
    redirect(encodeMessage("error", requeueResult.message));
  }

  runNightlyWorkerDetached({
    jobId,
    publish: boolFromForm(formData.get("publish")),
    deploy: boolFromForm(formData.get("deploy")),
    overwritePost: boolFromForm(formData.get("overwritePost")),
  });

  revalidatePath("/admin/pipeline");
  redirect(encodeMessage("ok", `Rerun started for ${jobId}.`));
}

function stepList(job: NightlyJob) {
  return Object.entries(job.steps || {})
    .map(([name, step]) => ({ name, step }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function PipelineAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  const level = single(params.level);
  const message = single(params.msg);
  const focusId = single(params.job);

  const [jobs, hubIndex] = await Promise.all([readJobs(), readHubIndex()]);
  const sortedJobs = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const runningCount = sortedJobs.filter((job) => job.status === "running").length;
  const failedCount = sortedJobs.filter((job) => job.status === "failed").length;
  const queuedCount = sortedJobs.filter((job) => job.status === "queued").length;
  const completedCount = sortedJobs.filter((job) => job.status === "completed").length;
  const tripCount = Object.keys(hubIndex.trips || {}).length;

  const focusJob = sortedJobs.find((job) => job.id === focusId)
    || sortedJobs.find((job) => job.status === "running")
    || sortedJobs.find((job) => job.status === "failed")
    || sortedJobs[0];
  const focusLog = focusJob ? await readJobLog(focusJob, 120) : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        <Link href="/" className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-black/15 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800 dark:hover:text-white">
          Home
        </Link>
        <span className="rounded-full border border-black/20 bg-white px-3 py-1.5 text-neutral-900 shadow-sm dark:border-white/25 dark:bg-neutral-900 dark:text-white">
          Pipeline Admin
        </span>
      </nav>

      <header className="mb-6 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">Nightly Pipeline Admin</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Queue share links, monitor worker progress, and rerun/publish failed jobs.
        </p>
        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-neutral-900">Queued: {queuedCount}</div>
          <div className="rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-neutral-900">Running: {runningCount}</div>
          <div className="rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-neutral-900">Failed: {failedCount}</div>
          <div className="rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-neutral-900">Completed: {completedCount}</div>
          <div className="rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-neutral-900">Trips Indexed: {tripCount}</div>
          <div className="rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-neutral-900">Hub Updated: {hubIndex.updatedAt ? renderTime(hubIndex.updatedAt) : "-"}</div>
        </div>
      </header>

      {message ? (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${level === "error" ? "border-rose-500/40 bg-rose-50 text-rose-700" : "border-emerald-500/40 bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      ) : null}

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <form action={enqueueAction} className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
          <h2 className="text-lg font-semibold">Enqueue Link</h2>
          <div className="mt-3 space-y-2 text-sm">
            <input name="link" placeholder="https://photos.app.goo.gl/..." required className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 dark:border-white/20 dark:bg-neutral-900" />
            <input name="title" placeholder="Title hint (optional)" className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 dark:border-white/20 dark:bg-neutral-900" />
            <input name="date" placeholder="Date hint YYYY-MM-DD" className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 dark:border-white/20 dark:bg-neutral-900" />
            <div className="grid grid-cols-2 gap-2">
              <input name="sampleCount" defaultValue="30" className="rounded-lg border border-black/15 bg-white px-3 py-2 dark:border-white/20 dark:bg-neutral-900" />
              <input name="downloadCount" defaultValue="24" className="rounded-lg border border-black/15 bg-white px-3 py-2 dark:border-white/20 dark:bg-neutral-900" />
            </div>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="publish" /> Auto publish</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="deploy" /> Auto deploy</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="overwritePost" /> Overwrite existing post</label>
            <button type="submit" className="mt-1 rounded-lg bg-neutral-900 px-3 py-2 text-white dark:bg-white dark:text-black">Enqueue</button>
          </div>
        </form>

        <form action={runWorkerAction} className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
          <h2 className="text-lg font-semibold">Run Worker</h2>
          <div className="mt-3 space-y-2 text-sm">
            <input name="maxJobs" defaultValue="3" className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 dark:border-white/20 dark:bg-neutral-900" />
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="retryFailed" /> Include failed jobs</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="publish" /> Force publish override</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="deploy" /> Force deploy override</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="overwritePost" /> Force overwrite post</label>
            <button type="submit" className="mt-1 rounded-lg bg-neutral-900 px-3 py-2 text-white dark:bg-white dark:text-black">Start Worker (Background)</button>
          </div>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
          <h2 className="text-lg font-semibold">Jobs</h2>
          <div className="mt-3 space-y-3">
            {sortedJobs.length === 0 ? (
              <p className="text-sm text-neutral-500">No jobs yet.</p>
            ) : sortedJobs.map((job) => (
              <article key={job.id} className="rounded-xl border border-black/10 px-3 py-3 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a href={`/admin/pipeline?job=${encodeURIComponent(job.id)}`} className="text-sm font-medium underline-offset-2 hover:underline">
                    {job.id}
                  </a>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-neutral-500">{job.source.link}</p>
                <p className="mt-1 text-xs text-neutral-500">slug: {job.output.slug || "-"}</p>
                <p className="mt-1 text-xs text-neutral-500">updated: {renderTime(job.updatedAt)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={requeueAction}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <button type="submit" className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20">Requeue</button>
                  </form>
                  <form action={rerunJobAction}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <button type="submit" className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20">Rerun</button>
                  </form>
                  <form action={rerunJobAction}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="publish" value="true" />
                    <input type="hidden" name="overwritePost" value="true" />
                    <button type="submit" className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20">Publish</button>
                  </form>
                  <form action={rerunJobAction}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="publish" value="true" />
                    <input type="hidden" name="deploy" value="true" />
                    <input type="hidden" name="overwritePost" value="true" />
                    <button type="submit" className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20">Publish + Deploy</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
          <h2 className="text-lg font-semibold">Job Detail</h2>
          {!focusJob ? (
            <p className="mt-3 text-sm text-neutral-500">Select a job to inspect details.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-black/10 p-3 text-xs dark:border-white/10">
                <p><span className="font-semibold">Job:</span> {focusJob.id}</p>
                <p><span className="font-semibold">Status:</span> {focusJob.status}</p>
                <p><span className="font-semibold">Slug:</span> {focusJob.output.slug || "-"}</p>
                <p><span className="font-semibold">Attempts:</span> {focusJob.attempts}</p>
                <p><span className="font-semibold">Link:</span> {focusJob.source.link}</p>
              </div>

              <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
                <p className="mb-2 text-xs font-semibold">Steps</p>
                <div className="space-y-2">
                  {stepList(focusJob).map(({ name, step }) => (
                    <div key={name} className="rounded-lg border border-black/10 px-2 py-2 text-xs dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{name}</span>
                        <span className={`rounded-full border px-2 py-0.5 ${statusClass(step.status)}`}>{step.status}</span>
                      </div>
                      <p className="mt-1 text-neutral-500">{step.message || "-"}</p>
                      <p className="mt-1 text-neutral-500">start: {renderTime(step.startedAt)}</p>
                      <p className="text-neutral-500">end: {renderTime(step.endedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
                <p className="mb-2 text-xs font-semibold">Latest Log</p>
                {focusLog.length === 0 ? (
                  <p className="text-xs text-neutral-500">No logs yet.</p>
                ) : (
                  <pre className="max-h-80 overflow-auto rounded-lg bg-neutral-100 p-2 text-[11px] leading-5 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                    {focusLog.join("\n")}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
