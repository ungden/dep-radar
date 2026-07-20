import { expect, test } from "@playwright/test"

test("homepage starts from a concern and shows fresh verified creator data", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Tìm đúng kiến thức cho tình trạng của bạn." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Tin mới từ KOL/KOC" })).toBeVisible()
  await page.waitForLoadState("networkidle")
  await page.getByRole("button", { name: "Trị mụn" }).click()
  await page.getByRole("link", { name: /Xem lộ trình phù hợp/ }).click()
  await expect(page).toHaveURL(/\/catalogue\/tri-mun/)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
})

test("Bioderma has no legacy score and no mismatched Loreal offer", async ({ page }) => {
  await page.goto("/products/3")
  await expect(page.getByRole("heading", { name: "Sensibio H2O Micellar Water" })).toBeVisible()
  await expect(page.getByText("Chưa có đánh giá cộng đồng", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /Chưa có offer đã xác minh/ })).toBeDisabled()
  await expect(page.locator('a[href*="loreal" i], a[href*="L%27Oreal" i]')).toHaveCount(0)
})

test("products and creator directory render real counts in first response", async ({ request, page }) => {
  const productsResponse = await request.get("/products")
  const productsHtml = await productsResponse.text()
  expect(productsHtml).toContain("sản phẩm phù hợp")
  expect(productsHtml).not.toContain(">0 sản phẩm phù hợp<")

  await page.goto("/koc-tracker")
  await expect(page.getByRole("heading", { name: "Danh bạ creator beauty" })).toBeVisible()
  await expect(page.getByText("Hồ sơ public").locator("..")).not.toContainText("...")
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
