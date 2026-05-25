import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchExperience } from "@/components/search-experience";
import { SiteNav } from "@/components/site-nav";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Search Stories and Rides",
    description: "Search TJ Adventure trip stories and cycling rides by destination, tags, landmarks, and route details.",
    pathname: "/search",
    keywords: ["travel search", "cycling search", "trip finder", "destination search", "route search"],
  }),
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="search" />
      <Suspense fallback={<SearchExperienceFallback />}>
        <SearchExperience />
      </Suspense>
    </main>
  );
}

function SearchExperienceFallback() {
  return (
    <section>
      <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:p-8">
        <div className="h-4 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 h-10 w-2/3 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-6 h-12 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </section>
  );
}
