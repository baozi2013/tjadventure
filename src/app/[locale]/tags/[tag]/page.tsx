import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PostCard } from "@/components/post-card";
import { SiteNav } from "@/components/site-nav";
import { createPageMetadata } from "@/lib/metadata";
import { getAllTags, getEntriesByTag } from "@/lib/tags";
import { resolveLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

type Params = {
  params: Promise<{ locale: string; tag: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getAllTags(locale).map(({ tag }) => ({ locale, tag })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { tag } = await params;
  const t = await getTranslations({ locale, namespace: "Tags" });

  return createPageMetadata({
    title: t("tagMetadataTitle", { tag }),
    description: t("tagMetadataDescription", { tag }),
    pathname: `/tags/${tag}`,
    locale,
  });
}

export default async function TagDetailPage({ params }: Params) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const { tag } = await params;
  const t = await getTranslations({ locale, namespace: "Tags" });
  const entries = getEntriesByTag(tag, locale);

  if (entries.length === 0) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="tags" />

      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link href="/tags" className="hover:text-neutral-900 dark:hover:text-white">{t("title")}</Link>
        <span>/</span>
        <span>{tag}</span>
      </nav>

      <header className="mb-8 rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("title")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{tag}</h1>
        <p className="mt-3 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          {t("tagCount", { count: entries.length })}
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <PostCard key={entry.href} post={entry} />
        ))}
      </div>
    </main>
  );
}
