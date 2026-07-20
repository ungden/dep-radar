import { expect, test } from "@playwright/test"

test("homepage starts from a concern and shows fresh verified creator data", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Bạn đang muốn giải quyết vấn đề gì?" })).toBeVisible()
  await expect(page.getByText("Tín hiệu creator mới", { exact: true })).toBeVisible()
  await expect(page.getByText(/nguồn creator đạt chuẩn/)).toBeVisible()
  await page.waitForLoadState("networkidle")
  await page.locator('a[href="/products?need=tri-mun"]').click()
  await expect(page).toHaveURL(/\/products\?need=tri-mun/)
  await expect(page.getByRole("heading", { name: /sản phẩm phù hợp/i })).toBeVisible()
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
