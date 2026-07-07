import Link from "next/link";

// This file has no root layout to inherit `<html>`/`<body>` from (the [locale]
// segment layout provides those for matched routes), so it renders a
// self-contained document for paths that never match any segment at all.
// It must avoid dynamic APIs (headers/cookies/searchParams) so the rest of
// the statically generated site isn't forced into fully dynamic rendering.
export default function RootNotFound() {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2.5rem 1.25rem",
            textAlign: "center",
            fontFamily:
              'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
          }}
        >
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.2em", color: "#737373", textTransform: "uppercase" }}>
            404
          </p>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.75rem", fontWeight: 600 }}>
            页面未找到 / Page Not Found
          </h1>
          <p style={{ marginTop: "1rem", maxWidth: "32rem", color: "#525252", lineHeight: 1.6 }}>
            你访问的页面不存在，或者已经被移动。
            <br />
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                borderRadius: "9999px",
                border: "1px solid #171717",
                backgroundColor: "#171717",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              返回首页
            </Link>
            <Link
              href="/en"
              style={{
                display: "inline-flex",
                borderRadius: "9999px",
                border: "1px solid #d4d4d4",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#171717",
                textDecoration: "none",
              }}
            >
              Back to home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
