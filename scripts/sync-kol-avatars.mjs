// Đồng bộ ảnh KOL: thả ảnh vào public/images/kol/<slug>.jpg rồi chạy:
//   node scripts/sync-kol-avatars.mjs
// Script tự gán avatar cho bất kỳ KOL nào đang để trống mà đã có file ảnh trùng tên (theo slug của tên).
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATA = path.join(ROOT, "lib/kols-data.ts")
const IMG_DIR = path.join(ROOT, "public/images/kol")

const stripDia = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
const slugify = (s) => stripDia(s).toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const fileOk = (fp) => fs.existsSync(fp) && fs.statSync(fp).size > 1500

const src = fs.readFileSync(DATA, "utf8")
const marker = "export const REAL_KOLS: Kol[] = "
const idx = src.indexOf(marker)
if (idx === -1) { console.error("Không tìm thấy REAL_KOLS trong lib/kols-data.ts"); process.exit(1) }
const header = src.slice(0, idx + marker.length)
const jsonPart = src.slice(idx + marker.length).trim().replace(/;?\s*$/, "")
const kols = JSON.parse(jsonPart)

let added = 0
for (const k of kols) {
  if (k.avatar) continue
  // chấp nhận .jpg / .jpeg / .png / .webp đặt theo slug tên
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const slug = slugify(k.name)
    const fp = path.join(IMG_DIR, `${slug}.${ext}`)
    if (fileOk(fp)) { k.avatar = `/images/kol/${slug}.${ext}`; added++; console.log("+ ", k.name, "->", `${slug}.${ext}`); break }
  }
}

fs.writeFileSync(DATA, header + JSON.stringify(kols, null, 2) + "\n")
const withAvatar = kols.filter((k) => k.avatar).length
console.log(`\nĐã gán thêm ${added} ảnh. Tổng cộng ${withAvatar}/${kols.length} hồ sơ có ảnh.`)
