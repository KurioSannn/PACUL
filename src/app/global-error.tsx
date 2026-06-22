"use client";

function retry(reset?: () => void) {
  if (typeof reset === "function") {
    reset();
    return;
  }

  window.location.reload();
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f4f7f2",
          color: "#1a2e1a",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Aplikasi mengalami gangguan</h1>
          <p style={{ margin: 0, maxWidth: "28rem", color: "#4a5c4a" }}>
            {error?.message ?? "Muat ulang halaman atau restart dev server jika masalah berlanjut."}
          </p>
          <button
            type="button"
            onClick={() => retry(reset)}
            style={{
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#2d5a3d",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
