import type { CategoryId } from "../types"

/**
 * Illustration photos for places that have no real work to show yet: the
 * catalogue cards when nobody nearby offers a service, the hero, the occasion
 * cards. They are shot the way customers shoot (a phone, a real flat), so the
 * page shows what the service looks like, not an advert; every surface that
 * uses one says "Ảnh minh hoạ".
 */
const W = "/images/works"
const C = "/images/catalog"

export const CATEGORY_PHOTOS: Record<CategoryId, string[]> = {
  nail: [`${W}/nail-milky-1.webp`, `${W}/nail-french.webp`, `${W}/nail-ombre.webp`, `${W}/nail-earth.webp`, `${W}/nail-nude-short.webp`, `${W}/nail-milky-2.webp`],
  makeup: [`${W}/makeup-party-2.webp`, `${W}/makeup-bride-2.webp`, `${W}/makeup-smoky.webp`, `${W}/makeup-bride-1.webp`, `${W}/makeup-party-1.webp`, `${W}/makeup-bridesmaid.webp`],
  skincare: [`${W}/skin-facial.webp`, `${W}/skin-glow.webp`, `${W}/skin-massage.webp`, `${W}/skin-deep.webp`],
  hair: [`${W}/hair-waves-1.webp`, `${W}/hair-bun-1.webp`, `${W}/hair-waves-2.webp`, `${W}/hair-bun-2.webp`],
  "lash-brow": [`${W}/lash-2.webp`, `${W}/brow-2.webp`, `${W}/lash-1.webp`, `${W}/brow-1.webp`],
  massage: [`${W}/massage-neck.webp`, `${W}/massage-foot.webp`, `${W}/massage-cupping.webp`],
  photophone: [`${C}/photophone.webp`],
  camera: [`${C}/camera.webp`],
  "short-video": [`${C}/short-video.webp`],
  "product-photo": [`${C}/product-photo.webp`],
  "model-photo": [`${C}/model-photo.webp`],
  "model-video": [`${C}/model-video.webp`],
}

/** The nth illustration of a category, cycling, so neighbouring cards differ. */
export const categoryPhoto = (category: CategoryId, index = 0) => {
  const list = CATEGORY_PHOTOS[category]
  return list[index % list.length]
}

export const OCCASION_PHOTOS: Record<string, string> = {
  "ao-dai-tet": `${W}/makeup-bride-2.webp`,
  "ky-yeu": `${W}/makeup-bridesmaid.webp`,
  "phu-nu": `${W}/makeup-party-2.webp`,
  "hen-ho": `${C}/photophone.webp`,
  "shop-online": `${C}/model-photo.webp`,
  "sinh-nhat": `${W}/makeup-party-1.webp`,
  "du-lich": `${C}/hero-photo.webp`,
  "ho-so": `${C}/camera.webp`,
}

export const HERO_PHOTOS = {
  beauty: `${C}/hero-beauty.webp`,
  photo: `${C}/hero-photo.webp`,
  model: `${C}/model-video.webp`,
} as const
