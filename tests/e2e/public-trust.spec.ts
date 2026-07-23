import { expect, test } from "@playwright/test"

test("homepage starts from a concern and only shows creator modules when data exists", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Hôm nay bạn muốn hiểu điều gì về làn da và cơ thể?" })).toBeVisible()
  const creatorModule = page.getByRole("heading", { name: "Review mới đã có nguồn đối chiếu" })
  if (await creatorModule.count()) await expect(creatorModule).toBeVisible()
  await page.waitForLoadState("networkidle")
  await page.getByRole("button", { name: "Mụn" }).click()
  await page.getByRole("link", { name: /Tiếp tục khám phá/ }).click()
  await expect(page).toHaveURL(/\/catalogue\/tri-mun/)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
})

test("Bioderma has no legacy score and no mismatched Loreal offer", async ({ page }) => {
  await page.goto("/products/3")
  await expect(page.getByRole("heading", { name: "Sensibio H2O Micellar Water" })).toBeVisible()
  await expect(page.getByText("Chưa có đánh giá cộng đồng", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /Chưa có nơi mua đã kiểm tra/ })).toBeDisabled()
  await expect(page.locator('a[href*="loreal" i], a[href*="L%27Oreal" i]')).toHaveCount(0)
})

test("reviewed exact-SKU evidence is visible while an unverified offer stays disabled", async ({ page }) => {
  await page.goto("/products/benzac-ac-mild-strength-2-5-acne-gel")
  await expect(page.getByRole("heading", { name: "Benzac AC Mild Strength 2.5% Acne Gel" })).toBeVisible()
  await expect(page.getByText("Một nguồn", { exact: true })).toBeVisible()
  await expect(page.getByText(/Benzac 2\.5% giảm sưng đáng kể/)).toBeVisible()
  await expect(page.getByRole("button", { name: /Chưa có nơi mua đã kiểm tra/ })).toBeDisabled()
})

test("creator evidence links back to the reviewed public source", async ({ page }) => {
  await page.goto("/koc-tracker/2")
  await expect(page.getByRole("heading", { name: "Góc Của Rư", exact: true })).toBeVisible()
  await expect(page.locator('a[href="/products/benzac-ac-mild-strength-2-5-acne-gel"]').first()).toBeVisible()
  const reviewedSource = page.locator('a[href="https://www.tiktok.com/@goc.cua.ru/video/7655905148123876616"]')
  await expect(reviewedSource.first()).toBeVisible()
  await expect(reviewedSource.first()).toHaveAttribute("target", "_blank")
})

test("product evidence preserves creator, exact SKU and original TikTok clip", async ({ page }) => {
  await page.goto("/products/cocoon-winter-melon-micellar-water-1000ml")
  await expect(page.getByRole("heading", { name: "Nước tẩy trang bí đao 1000ml" })).toBeVisible()
  await expect(page.getByText("Đã đối chiếu", { exact: true })).toBeVisible()
  await expect(page.getByText("Vân Miu", { exact: true })).toBeVisible()
  await expect(page.getByText("Skincare Đúng Cách by Sơn", { exact: true })).toBeVisible()

  const vanMiuClip = page.locator('a[href="https://www.tiktok.com/@vanmiu_beauty/video/7644185590895840533"]')
  const sonClip = page.locator('a[href="https://www.tiktok.com/@skincaredungcach.byson/video/7599940752742927623"]')
  await expect(vanMiuClip).toContainText("ID 7644185590895840533")
  await expect(sonClip).toContainText("ID 7599940752742927623")
  await expect(vanMiuClip).toHaveAttribute("target", "_blank")
  await expect(sonClip).toHaveAttribute("target", "_blank")
})

test("products and creator directory render real counts in first response", async ({ request, page }) => {
  const productsResponse = await request.get("/products")
  const productsHtml = await productsResponse.text()
  expect(productsHtml).toContain("sản phẩm phù hợp")
  expect(productsHtml).not.toContain(">0 sản phẩm phù hợp<")

  await page.goto("/koc-tracker")
  await expect(page.getByRole("heading", { name: "Danh bạ người sáng tạo nội dung làm đẹp" })).toBeVisible()
  await expect(page.getByText("Hồ sơ đang hiển thị").locator("..")).not.toContainText("...")
})

test("accessibility smoke: skip link, named theme control and keyboard focus", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab")
  const skipLink = page.getByRole("link", { name: "Bỏ qua điều hướng" })
  await expect(skipLink).toBeFocused()
  await skipLink.press("Enter")
  await expect(page.locator("#main-content")).toBeFocused()
  await expect(page.getByRole("button", { name: /Bật giao diện (tối|sáng)/ })).toBeVisible()
})
