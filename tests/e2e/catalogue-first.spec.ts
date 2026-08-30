import { expect, test } from "@playwright/test"

test("finder keeps the journey inside the selected catalogue", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Mụn", exact: true }).click()
  await page.getByRole("link", { name: /Tiếp tục khám phá/ }).click()

  await expect(page).toHaveURL(/\/catalogue\/tri-mun/)
  await expect(page.getByRole("heading", { name: "Trị mụn", level: 1 })).toBeVisible()
  await expect(page).not.toHaveURL(/\/search/)
})

test("catalogue index exposes four groups and every hub", async ({ page }) => {
  await page.goto("/catalogue")
  for (const group of ["Da & chăm sóc chuyên sâu", "Tóc & cơ thể", "Trang điểm & mùi hương", "Lối sống, dịch vụ & công nghệ"]) {
    await expect(page.getByRole("heading", { name: group, exact: true })).toBeVisible()
  }
  await expect(page.getByTestId("catalogue-card")).toHaveCount(14)
})
