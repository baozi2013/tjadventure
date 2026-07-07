"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Catches errors thrown by the [locale] segment layout itself (rare). Like
// not-found.tsx at this level, it has no root layout to inherit from, so it
// must render its own <html>/<body>.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
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
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>Something went wrong / 出错了</h1>
          <p style={{ marginTop: "1rem", maxWidth: "32rem", color: "#525252", lineHeight: 1.6 }}>
            Please try again, or head back to the homepage.
            <br />
            请重试，或者返回首页。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              display: "inline-flex",
              borderRadius: "9999px",
              border: "1px solid #171717",
              backgroundColor: "#171717",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again / 重试
          </button>
        </main>
      </body>
    </html>
  );
}
