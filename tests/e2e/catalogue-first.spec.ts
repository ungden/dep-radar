import { expect, test } from "@playwright/test"

test("finder keeps the journey inside the selected catalogue", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Trị mụn", exact: true }).click()
  await page.getByRole("button", { name: "Mụn ẩn", exact: true }).click()
  await page.getByRole("button", { name: "Da nhạy cảm", exact: true }).click()
  await page.getByRole("button", { name: "Dưới 200k", exact: true }).click()
  await page.getByRole("link", { name: /Xem hướng dẫn dành cho tôi/ }).click()

  await expect(page).toHaveURL(/\/catalogue\/tri-mun\?condition=mun-an&skin=da-nhay-cam&budget=duoi-200k/)
  await expect(page.getByRole("heading", { name: "Trị mụn", level: 1 })).toBeVisible()
  const selectedContext = page.getByText("Lựa chọn của bạn").locator("..")
  await expect(selectedContext).toContainText("Mụn ẩn")
  await expect(selectedContext).toContainText("Da nhạy cảm")
  await expect(selectedContext).toContainText("Dưới 200k")
  await expect(page).not.toHaveURL(/\/search/)
})

test("catalogue index exposes four groups and every hub", async ({ page }) => {
  await page.goto("/catalogue")
  for (const group of ["Da & chăm sóc chuyên sâu", "Tóc & cơ thể", "Trang điểm & mùi hương", "Lối sống, dịch vụ & công nghệ"]) {
    await expect(page.getByRole("heading", { name: group, exact: true })).toBeVisible()
  }
  await expect(page.getByTestId("catalogue-card")).toHaveCount(14)
})
