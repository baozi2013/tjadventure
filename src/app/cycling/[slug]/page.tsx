import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAllCyclingEntries, getCyclingEntryBySlug } from "@/lib/cycling";
import { createPageMetadata } from "@/lib/metadata";
import { mdxComponents } from "@/components/mdx-components";
import { SiteNav } from "@/components/site-nav";
import type { CyclingEntry } from "@/types/cycling";

type Params = {
  params: Promise<{ slug: string }>;
};

const RIDE_TYPE_LABELS: Record<CyclingEntry["rideType"], string> = {
  road: "Road",
  event: "Event",
  gravel: "Gravel",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCyclingEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getCyclingEntryBySlug(slug);

  if (!entry) {
    return createPageMetadata({
      title: "Ride Not Found",
      description: "The requested cycling ride could not be found.",
      pathname: `/cycling/${slug}`,
    });
  }

  return createPageMetadata({
    title: entry.title,
    description: entry.excerpt,
    pathname: `/cycling/${slug}`,
    image: entry.coverImage,
    keywords: entry.tags,
    type: "article",
    publishedTime: entry.rideDate,
    section: `Cycling · ${RIDE_TYPE_LABELS[entry.rideType]}`,
    tags: entry.tags,
  });
}

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function formatMeasurement(measure: { value: number; unit: string; display?: string }) {
  return measure.display ?? `${measure.value.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${measure.unit}`;
}

function formatSurface(surface: string) {
  return surface
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRouteSummary(entry: CyclingEntry) {
  const route = entry.route;
  if (!route) return [];

  return [
    route.name ? { label: "Route", value: route.name } : null,
    route.start ? { label: "Start", value: route.start } : null,
    route.finish ? { label: "Finish", value: route.finish } : null,
    route.surface ? { label: "Surface", value: route.surface.map(formatSurface).join(" / ") } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
}

function SourceBlock({ entry }: { entry: CyclingEntry }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Source</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Strava activity</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        Use the original activity for source stats, route trace, and later sync work.
      </p>
      <a
        href={entry.stravaUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold !text-white shadow-sm shadow-black/10 transition hover:bg-neutral-800 dark:border-white/20 dark:bg-white dark:!text-neutral-950 dark:hover:bg-neutral-100"
      >
        Open on Strava
      </a>
    </section>
  );
}

function DetailList({ title, items }: { title: string; items: string[] | undefined }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{title}</p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900 dark:bg-white" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function CyclingDetailPage({ params }: Params) {
  const { slug } = await params;
  const entry = getCyclingEntryBySlug(slug);

  if (!entry) notFound();

  const routeSummary = getRouteSummary(entry);
  const stats = [
    { label: "Distance", value: formatMeasurement(entry.distance) },
    { label: "Elevation", value: formatMeasurement(entry.elevationGain) },
    { label: "Moving Time", value: entry.movingTime },
    { label: "Ride Date", value: formatDate(entry.rideDate) },
  ];

  const { content } = await compileMDX({
    source: entry.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "append" }]],
      },
    },
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="cycling" />

      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">
          Home
        </Link>
        <span>/</span>
        <Link href="/cycling" className="hover:text-neutral-900 dark:hover:text-white">
          Cycling
        </Link>
        <span>/</span>
        <span>{RIDE_TYPE_LABELS[entry.rideType]}</span>
      </nav>

      <article className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <header className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950">
            <div className="relative h-72 w-full overflow-hidden sm:h-96">
              <Image
                src={entry.coverImage}
                alt={entry.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 860px"
                priority
              />
              <div className="absolute left-5 top-5 rounded-full border border-white/40 bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                {RIDE_TYPE_LABELS[entry.rideType]}
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                {entry.location.name} · {entry.location.region}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{entry.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-neutral-700 dark:text-neutral-300">
                {entry.excerpt}
              </p>
              {entry.tags && entry.tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600 dark:border-white/15 dark:text-neutral-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{stat.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Location</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{entry.location.name}</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {entry.location.note ?? entry.location.region}
                </p>
              </div>
              {entry.location.lat != null && entry.location.lng != null ? (
                <div className="rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10">
                  <p className="text-neutral-500">Coordinates</p>
                  <p className="mt-1 font-medium">
                    {entry.location.lat}, {entry.location.lng}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          {routeSummary.length > 0 ? (
            <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Route Overview</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {routeSummary.map((item) => (
                  <div key={item.label} className="rounded-xl border border-black/10 px-4 py-3 dark:border-white/10">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{item.label}</p>
                    <p className="mt-2 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <DetailList title="Logistics" items={entry.logistics} />
            <DetailList title="Notes" items={entry.notes} />
          </div>

          <div className="mdx-content mt-8 max-w-none">{content}</div>

          {entry.images && entry.images.length > 0 ? (
            <section className="mt-10 border-t border-black/10 pt-8 dark:border-white/10">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Photos</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Ride Gallery</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {entry.images.map((image) => (
                  <figure
                    key={image.src}
                    className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-950"
                  >
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 639px) 100vw, 50vw"
                      />
                    </div>
                    {image.caption ? (
                      <figcaption className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                        {image.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-4">
            <SourceBlock entry={entry} />
            <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Ride Snapshot</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-neutral-500">Type</dt>
                  <dd className="mt-1 font-medium text-neutral-900 dark:text-white">{RIDE_TYPE_LABELS[entry.rideType]}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Location</dt>
                  <dd className="mt-1 font-medium text-neutral-900 dark:text-white">{entry.location.region}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Distance</dt>
                  <dd className="mt-1 font-medium text-neutral-900 dark:text-white">{formatMeasurement(entry.distance)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Elevation</dt>
                  <dd className="mt-1 font-medium text-neutral-900 dark:text-white">
                    {formatMeasurement(entry.elevationGain)}
                  </dd>
                </div>
              </dl>
            </section>

            {entry.headings.length > 0 ? (
              <section className="hidden rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950 lg:block">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Contents</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {entry.headings.map((heading) => (
                    <li key={heading.id} className={heading.level === 3 ? "ml-3" : ""}>
                      <a href={`#${heading.id}`} className="text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white">
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </aside>
      </article>
    </main>
  );
}
