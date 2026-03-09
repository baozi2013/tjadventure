export type Post = {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  slug: string;
  coverImage: string;
};

// CMS-ready: replace these with your CMS image URLs later.
// e.g. Sanity/Contentful/Notion/S3/CDN links.
export const featuredPost: Post = {
  title: "Joffre Lakes｜四百米爬升中与冰川湖的多次邂逅",
  excerpt:
    "往返 5mi、爬升约 400m，一次看到三个冰川湖。难点不在体力，在抢票和停车。",
  date: "2026-03-09",
  category: "Canada · Hiking",
  readTime: "12 min",
  slug: "joffre-lakes",
  coverImage:
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop",
};

export const posts: Post[] = [
  {
    title: "Sea to Sky Highway｜海天一线公路日记",
    excerpt: "温哥华一路向北，观景点密集，晴天真的像电影场景。",
    date: "2026-03-05",
    category: "Canada · Road Trip",
    readTime: "8 min",
    slug: "sea-to-sky",
    coverImage:
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Squamish 小镇速记｜吃住行真实成本",
    excerpt: "长周末住宿贵，但补给方便；适合当进山前一晚中转站。",
    date: "2026-02-25",
    category: "Canada · Town",
    readTime: "6 min",
    slug: "squamish-guide",
    coverImage:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Whistler 夏季轻徒步清单",
    excerpt: "不想硬核爬山，也能花钱买风景：缆车、短线步道和亲子玩法。",
    date: "2026-02-10",
    category: "Canada · Family",
    readTime: "7 min",
    slug: "whistler-summer",
    coverImage:
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "东京雨天两日计划（不狼狈版）",
    excerpt: "把暴走改成室内+短移动，照样玩得好、吃得好、拍得好。",
    date: "2026-01-20",
    category: "Japan · City",
    readTime: "9 min",
    slug: "tokyo-rainy-days",
    coverImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1600&auto=format&fit=crop",
  },
];

export const categories = ["全部", "Canada", "Japan", "Hiking", "Road Trip", "Family"];
