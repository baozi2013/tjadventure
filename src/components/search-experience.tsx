"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PostCard } from "@/components/post-card";
import type { SearchIndexEntry } from "@/types/search";

type SearchIndexResponse = {
  generatedAt: string;
  posts: SearchIndexEntry[];
};

const DEFAULT_RESULTS_LIMIT = 9;
const SEARCH_RESULTS_LIMIT = 12;
const EMPTY_POSTS: SearchIndexEntry[] = [];
const FUSE_OPTIONS: IFuseOptions<SearchIndexEntry> = {
  threshold: 0.34,
  ignoreLocation: true,
  keys: [
    { name: "title", weight: 0.34 },
    { name: "excerpt", weight: 0.2 },
    { name: "tags", weight: 0.14 },
    { name: "locations", weight: 0.12 },
    { name: "headings", weight: 0.1 },
    { name: "category", weight: 0.06 },
    { name: "body", weight: 0.04 },
  ],
};

function getQuickSuggestions(posts: SearchIndexEntry[]) {
  const regions = Array.from(new Set(posts.map((post) => post.region)));
  const tags = Array.from(
    new Set(
      posts
        .flatMap((post) => post.tags)
        .filter((tag) => tag.trim().length > 0),
    ),
  );

  return [...regions.slice(0, 4), ...tags.slice(0, 4)].slice(0, 6);
}

function formatGeneratedAt(value: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SearchExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [data, setData] = useState<SearchIndexResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSearchIndex() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/search-index.json", {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load search index (${response.status})`);
        }

        const nextData = (await response.json()) as SearchIndexResponse;
        if (!isCancelled) {
          setData(nextData);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load search index.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSearchIndex();

    return () => {
      isCancelled = true;
    };
  }, []);

  const posts = data?.posts ?? EMPTY_POSTS;
  const quickSuggestions = useMemo(() => getQuickSuggestions(posts), [posts]);
  const normalizedQuery = query.trim();

  const fuse = useMemo(() => {
    if (posts.length === 0) return null;
    return new Fuse(posts, FUSE_OPTIONS);
  }, [posts]);

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return posts.slice(0, DEFAULT_RESULTS_LIMIT);
    }

    if (!fuse) {
      return [];
    }

    return fuse
      .search(normalizedQuery)
      .slice(0, SEARCH_RESULTS_LIMIT)
      .map((result) => result.item);
  }, [fuse, normalizedQuery, posts]);

  const generatedAt = formatGeneratedAt(data?.generatedAt ?? "");

  function syncUrl(nextQuery: string) {
    const trimmedQuery = nextQuery.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    } else {
      params.delete("q");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    syncUrl(query);
  }

  function handleClear() {
    setQuery("");
    syncUrl("");
  }

  return (
    <section>
      <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Search</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              找到你下一篇想读的路线
            </h1>
            <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300 sm:text-base">
              可以搜目的地、州名、路线主题、景点名，或者正文里的关键词。比如 `Yellowstone`、`Christmas`
              、`Carmel`、`coastal drive`。
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300">
            <p className="font-medium text-neutral-900 dark:text-white">{posts.length} posts indexed</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">
              {generatedAt ? `Updated ${generatedAt}` : "Search index ready"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 lg:flex-row">
          <label className="sr-only" htmlFor="site-search">
            Search posts
          </label>
          <input
            id="site-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by destination, keyword, or story detail"
            className="min-h-12 flex-1 rounded-2xl border border-black/10 bg-neutral-50 px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white dark:focus:bg-neutral-950"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="min-h-12 rounded-2xl bg-neutral-900 px-5 text-sm font-semibold !text-white transition hover:bg-neutral-800 dark:bg-white dark:!text-neutral-950 dark:hover:bg-neutral-100"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="min-h-12 rounded-2xl border border-black/10 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              Clear
            </button>
          </div>
        </form>

        {quickSuggestions.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setQuery(suggestion);
                  syncUrl(suggestion);
                }}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600 transition hover:bg-neutral-100 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            {normalizedQuery ? "Search Results" : "Browse Suggestions"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {normalizedQuery ? `“${normalizedQuery}”` : "Recent posts from the index"}
          </h2>
        </div>
        <p className="text-sm text-neutral-500">
          {normalizedQuery
            ? `${results.length} result${results.length === 1 ? "" : "s"}`
            : `Showing ${Math.min(posts.length, DEFAULT_RESULTS_LIMIT)} recent posts`}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950"
            >
              <div className="h-44 animate-pulse bg-neutral-200 dark:bg-neutral-800" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-5 w-4/5 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          Search index failed to load: {error}
        </div>
      ) : results.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-black/10 px-5 py-8 text-sm text-neutral-600 dark:border-white/10 dark:text-neutral-300">
          没有找到匹配结果。试试换一个地名、国家、节日主题，或者直接搜景点名。
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
