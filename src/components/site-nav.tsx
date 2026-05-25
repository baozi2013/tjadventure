import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Home", key: "home" },
  { href: "/about", label: "About Us", key: "about" },
  { href: "/gears", label: "Gears", key: "gears" },
  { href: "/trips", label: "All Trips", key: "trips" },
  { href: "/cycling", label: "Cycling", key: "cycling" },
  { href: "/search", label: "Search", key: "search" },
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
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className={getItemClassName(current === item.key)}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
