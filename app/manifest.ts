import type { MetadataRoute } from "next"

/** What a phone uses when 360đẹp is added to the home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "360đẹp · Đặt làm đẹp, chụp ảnh, người mẫu",
    short_name: "360đẹp",
    description: "Đặt thợ nail, makeup, chăm sóc da, người chụp ảnh và người mẫu gần bạn. Giá niêm yết, đặt lịch nhanh.",
    lang: "vi",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6F4",
    theme_color: "#FAF6F4",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
