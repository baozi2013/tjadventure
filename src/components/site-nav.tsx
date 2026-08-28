import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV_ITEMS = [
  { href: "/", labelKey: "home", key: "home" },
  { href: "/about", labelKey: "about", key: "about" },
  { href: "/gears", labelKey: "gears", key: "gears" },
  { href: "/trips", labelKey: "trips", key: "trips" },
  { href: "/map", labelKey: "map", key: "map" },
  { href: "/cycling", labelKey: "cycling", key: "cycling" },
  { href: "/learning", labelKey: "learning", key: "learning" },
  { href: "/tags", labelKey: "tags", key: "tags" },
  { href: "/stats", labelKey: "stats", key: "stats" },
  { href: "/search", labelKey: "search", key: "search" },
] as const;

type SiteNavKey = (typeof NAV_ITEMS)[number]["key"];

type SiteNavProps = {
  current?: SiteNavKey;
};

function getItemClassName(isActive: boolean) {
  if (isActive) {
    return "rounded-full border border-black/20 bg-white px-3 py-1.5 text-neutral-900 shadow-sm dark:border-white/25 dark:bg-neutral-900 dark:text-white";
  }

  return "rounded-full border border-transparent px-3 py-1.5 transition hover:border-black/15 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800 dark:hover:text-white";
}

export function SiteNav({ current }: SiteNavProps) {
  const t = useTranslations("Nav");

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
      <div className="flex flex-wrap items-center gap-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={getItemClassName(current === item.key)}>
            {t(item.labelKey)}
          </Link>
        ))}
      </div>
      <Suspense fallback={<LanguageSwitcherFallback zhLabel={t("zh")} enLabel={t("en")} />}>
        <LanguageSwitcher />
      </Suspense>
    </nav>
  );
}

function LanguageSwitcherFallback({ zhLabel, enLabel }: { zhLabel: string; enLabel: string }) {
  return (
    <div className="ml-auto inline-flex rounded-full border border-black/10 bg-white p-0.5 text-xs font-semibold shadow-sm dark:border-white/10 dark:bg-neutral-950">
      <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-white dark:bg-white dark:text-neutral-950">
        {zhLabel}
      </span>
      <span className="rounded-full px-2.5 py-1 text-neutral-500">{enLabel}</span>
    </div>
  );
}
