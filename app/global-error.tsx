"use client"

/** Last-resort boundary: the root layout failed, so this renders its own <html>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          background: "#FAF6F4",
          color: "#3A2A2C",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: -1.2 }}>
          360<span style={{ color: "#A8535D" }}>đẹp</span>
        </p>
        <h1 style={{ fontSize: 18, margin: 0 }}>Ứng dụng gặp sự cố</h1>
        <p style={{ fontSize: 14, color: "#65575A", maxWidth: 360, margin: 0 }}>
          Mình xin lỗi vì sự bất tiện. Bạn thử tải lại trang nhé.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: 8, padding: "12px 20px", borderRadius: 999, border: 0, background: "#A8535D", color: "#fff", fontSize: 15 }}
        >
          Tải lại
        </button>
        {error.digest && <p style={{ fontSize: 12, color: "#736366" }}>Mã lỗi: {error.digest}</p>}
      </body>
    </html>
  )
}
