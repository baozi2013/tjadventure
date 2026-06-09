import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import { getTranslations, setRequestLocale } from "next-intl/server";
import remarkGfm from "remark-gfm";
import { SiteNav } from "@/components/site-nav";
import { mdxComponents } from "@/components/mdx-components";
import { createPageMetadata } from "@/lib/metadata";
import { getLocalizedContentPath } from "@/lib/content-locale";
import { resolveLocale, type LocaleParams } from "@/i18n/locale";
import type { Locale } from "@/i18n/routing";

const GEARS_DIR = path.join(process.cwd(), "content/gears");
const GEARS_EN_DIR = path.join(process.cwd(), "content/en/gears");

type PageProps = {
  params: LocaleParams;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Gears" });

  return createPageMetadata({
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    pathname: "/gears",
    locale,
    image: "/gears/sonya6300.jpeg",
    keywords: ["travel gear", "camping gear", "camera gear", "family trip packing"],
  });
}

async function renderGearMarkdown(fileName: string, locale: Locale, missingTitle: string, missingDescription: string) {
  const fullPath = getLocalizedContentPath(GEARS_DIR, GEARS_EN_DIR, fileName, locale);
  const source = fs.existsSync(fullPath)
    ? fs.readFileSync(fullPath, "utf8")
    : `# ${missingTitle}\n\n${missingDescription}`;

  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return content;
}

export default async function GearsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Gears" });
  const campingContent = await renderGearMarkdown("camping-gear.md", locale, t("missingTitle"), t("missingDescription"));
  const photoContent = await renderGearMarkdown("photo-gear.md", locale, t("missingTitle"), t("missingDescription"));

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="gears" />

      <section className="rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>

        <div className="mt-6 space-y-8">
          <article className="rounded-2xl border border-black/10 px-5 py-5 dark:border-white/10">
            <div className="mdx-content max-w-none">{campingContent}</div>
          </article>

          <article className="rounded-2xl border border-black/10 px-5 py-5 dark:border-white/10">
            <div className="mdx-content max-w-none">{photoContent}</div>
          </article>
        </div>
      </section>
    </main>
  );
}
