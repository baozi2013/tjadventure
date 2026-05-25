import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CYCLING_RIDE_TYPES, type CyclingRideType, type CyclingSummary } from "@/types/cycling";
import { getAllCyclingEntries } from "@/lib/cycling";
import { getAllPosts, type PostSummary } from "@/lib/posts";
import { createPageMetadata } from "@/lib/metadata";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = createPageMetadata({
  title: "Cycling",
  description: "Ride notes, event recaps, and cycling routes from TJ Adventure.",
  pathname: "/cycling",
  keywords: ["cycling routes", "Strava rides", "road cycling", "cycling events", "TJ Adventure cycling"],
});

type RideCard = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  coverImage: string;
  href: string;
  isExternal?: boolean;
  locationLabel: string;
  rideType: CyclingRideType;
  sourceLabel: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
};

const RIDE_TYPE_META: Record<CyclingRideType, { label: string; summary: string }> = {
  road: {
    label: "Road",
    summary: "Weekend loops, climbs, and paved-route ride notes.",
  },
  event: {
    label: "Event",
    summary: "Organized rides, expos, and family-friendly cycling days.",
  },
  gravel: {
    label: "Gravel",
    summary: "Mixed-surface rides and dirt-road route notes.",
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function formatMeasurement(measure: { value: number; unit: string; display?: string }) {
  return measure.display ?? `${measure.value.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${measure.unit}`;
}

function inferRideType(post: PostSummary): CyclingRideType | null {
  const text = `${post.category} ${(post.tags ?? []).join(" ")}`.toLowerCase();

  if (!text.includes("cycling")) {
    return null;
  }

  if (text.includes("gravel")) {
    return "gravel";
  }

  if (text.includes("event") || text.includes("sea-otter") || text.includes("bike-expo")) {
    return "event";
  }

  return "road";
}

function cyclingEntryToRideCard(entry: CyclingSummary): RideCard {
  return {
    id: `cycling:${entry.slug}`,
    title: entry.title,
    excerpt: entry.excerpt,
    date: entry.rideDate,
    coverImage: entry.coverImage,
    href: `/cycling/${entry.slug}`,
    locationLabel: `${entry.location.name} · ${entry.location.region}`,
    rideType: entry.rideType,
    sourceLabel: "Ride log",
    metrics: [
      { label: "Distance", value: formatMeasurement(entry.distance) },
      { label: "Climb", value: formatMeasurement(entry.elevationGain) },
      { label: "Moving", value: entry.movingTime },
    ],
  };
}

function postToRideCard(post: PostSummary, rideType: CyclingRideType): RideCard {
  return {
    id: `post:${post.slug}`,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    coverImage: post.coverImage,
    href: `/posts/${post.slug}`,
    locationLabel: post.category,
    rideType,
    sourceLabel: "Trip story",
    metrics: [
      { label: "Read", value: post.readTime },
      { label: "Published", value: formatDate(post.date) },
    ],
  };
}

function getRideCards() {
  const cyclingEntries = getAllCyclingEntries();
  const dedicatedSlugs = new Set(cyclingEntries.map((entry) => entry.slug));
  const entryCards = cyclingEntries.map(cyclingEntryToRideCard);
  const postCards = getAllPosts()
    .filter((post) => !dedicatedSlugs.has(post.slug))
    .map((post) => {
      const rideType = inferRideType(post);
      return rideType ? postToRideCard(post, rideType) : null;
    })
    .filter((card): card is RideCard => Boolean(card));

  return [...entryCards, ...postCards].sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

function RideCardLink({ ride, priority }: { ride: RideCard; priority?: boolean }) {
  const content = (
    <>
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={ride.coverImage}
          alt={ride.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          priority={priority}
        />
        <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-black/55 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
          {RIDE_TYPE_META[ride.rideType].label}
        </div>
      </div>
      <div className="flex min-h-72 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span>{ride.sourceLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(ride.date)}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:underline">{ride.title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{ride.excerpt}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {ride.metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-black/10 px-3 py-2 dark:border-white/10">
              <p className="text-neutral-500">{metric.label}</p>
              <p className="mt-1 font-semibold text-neutral-900 dark:text-white">{metric.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-auto pt-5 text-xs uppercase tracking-wider text-neutral-500">{ride.locationLabel}</p>
      </div>
    </>
  );

  const className =
    "group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-950";

  if (ride.isExternal) {
    return (
      <a href={ride.href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={ride.href} className={className}>
      {content}
    </Link>
  );
}

export default function CyclingPage() {
  const rideCards = getRideCards();
  const groupedRides = CYCLING_RIDE_TYPES.map((rideType) => ({
    rideType,
    rides: rideCards.filter((ride) => ride.rideType === rideType),
  })).filter((group) => group.rides.length > 0);
  const latestRide = rideCards[0];

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="cycling" />

      <header className="mb-8 overflow-hidden rounded-3xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-950">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-7 sm:p-9">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Cycling Collection</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Ride notes with routes, rhythm, and finish-line memory.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-700 dark:text-neutral-300">
              Road loops, event weekends, and the practical bits that make a ride repeatable: where it starts,
              how it feels, and what to remember next time.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              {groupedRides.map((group) => (
                <a
                  key={group.rideType}
                  href={`#ride-type-${group.rideType}`}
                  className="rounded-full border border-black/10 px-3 py-1 transition hover:bg-neutral-100 dark:border-white/15 dark:hover:bg-neutral-900"
                >
                  {RIDE_TYPE_META[group.rideType].label} · {group.rides.length}
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-black/10 bg-neutral-100 p-6 dark:border-white/10 dark:bg-neutral-900/70 lg:border-l lg:border-t-0">
            <div className="grid h-full content-between gap-4">
              <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Latest Ride</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{latestRide?.title ?? "More rides soon"}</p>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  {latestRide ? `${RIDE_TYPE_META[latestRide.rideType].label} · ${formatDate(latestRide.date)}` : "The ride log is warming up."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Rides</p>
                  <p className="mt-3 text-3xl font-semibold">{rideCards.length}</p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Types</p>
                  <p className="mt-3 text-3xl font-semibold">{groupedRides.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {rideCards.length === 0 ? (
        <p className="rounded-2xl border border-black/10 bg-white px-5 py-6 text-sm text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">
          No cycling rides yet.
        </p>
      ) : (
        <div className="space-y-10">
          {groupedRides.map((group) => (
            <section key={group.rideType} id={`ride-type-${group.rideType}`}>
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Ride Type</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{RIDE_TYPE_META[group.rideType].label}</h2>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                    {RIDE_TYPE_META[group.rideType].summary}
                  </p>
                </div>
                <p className="text-sm text-neutral-500">{group.rides.length} rides</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.rides.map((ride, index) => (
                  <RideCardLink key={ride.id} ride={ride} priority={index === 0 && group.rideType === groupedRides[0]?.rideType} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
