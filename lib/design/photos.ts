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
  makeup: [`${W}/makeup-bride-1.webp`, `${W}/makeup-bridesmaid.webp`, `${W}/makeup-party-1.webp`,`${W}/makeup-bride-2.webp`, `${W}/makeup-party-2.webp`, `${W}/makeup-smoky.webp`],
  skincare: [`${W}/skin-facial.webp`, `${W}/skin-glow.webp`, `${W}/skin-massage.webp`, `${W}/skin-deep.webp`, `${W}/skin-mask-1.webp`, `${W}/skin-steam-1.webp`],
  hair: [`${W}/hair-waves-1.webp`, `${W}/hair-bun-1.webp`, `${W}/hair-waves-2.webp`, `${W}/hair-bun-2.webp`, `${W}/hair-curl-1.webp`, `${W}/hair-braid-1.webp`],
  "lash-brow": [`${W}/lash-2.webp`, `${W}/brow-2.webp`, `${W}/lash-1.webp`, `${W}/brow-1.webp`, `${W}/lash-apply-1.webp`, `${W}/brow-shape-1.webp`],
  massage: [`${W}/massage-neck.webp`, `${W}/massage-foot.webp`, `${W}/massage-cupping.webp`, `${W}/massage-back-1.webp`, `${W}/massage-head-1.webp`],
  photophone: [`${C}/photophone.webp`, `${C}/photophone-2.webp`, `${C}/photophone-3.webp`, `${C}/photophone-4.webp`],
  camera: [`${C}/camera.webp`, `${C}/camera-2.webp`, `${C}/camera-3.webp`, `${C}/camera-4.webp`],
  "short-video": [`${C}/short-video.webp`, `${C}/short-video-2.webp`, `${C}/short-video-3.webp`, `${C}/short-video-4.webp`],
  "product-photo": [`${C}/product-photo.webp`, `${C}/product-photo-2.webp`, `${C}/product-photo-3.webp`, `${C}/product-photo-4.webp`],
  "model-photo": [`${C}/model-photo.webp`, `${C}/model-photo-2.webp`, `${C}/model-photo-3.webp`, `${C}/model-photo-4.webp`],
  "model-video": [`${C}/model-video.webp`, `${C}/model-video-2.webp`, `${C}/model-video-3.webp`, `${C}/model-video-4.webp`],
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
