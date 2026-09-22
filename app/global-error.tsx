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
          background: "#FAFAF8",
          color: "#2b2322",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          dep<span style={{ color: "#161413" }}>360</span>
        </p>
        <h1 style={{ fontSize: 18, margin: 0 }}>Ứng dụng gặp sự cố</h1>
        <p style={{ fontSize: 14, color: "#5b4f4d", maxWidth: 360, margin: 0 }}>
          Mình xin lỗi vì sự bất tiện. Bạn thử tải lại trang nhé.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: 8, padding: "12px 20px", borderRadius: 14, border: 0, background: "#161413", color: "#fff", fontSize: 15 }}
        >
          Tải lại
        </button>
        {error.digest && <p style={{ fontSize: 12, color: "#7a6c6a" }}>Mã lỗi: {error.digest}</p>}
      </body>
    </html>
  )
}
