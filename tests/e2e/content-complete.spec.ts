import { expect, test } from "@playwright/test"

test("knowledge library publishes all completed catalogue articles", async ({ page }) => {
  await page.goto("/blog")

  await expect(page.getByRole("heading", { level: 1, name: "Kiến thức làm đẹp" })).toBeVisible()
  await expect(page.getByText("112 bài đã hoàn thiện")).toBeVisible()
  await expect(page.getByRole("button", { name: "Trị mụn", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Công nghệ làm đẹp", exact: true })).toBeVisible()
})

test("completed article has topic-specific guidance, safety boundary and sources", async ({ page }) => {
  await page.goto("/blog/pregnancy-safe-ingredient-checklist")

  await expect(page.getByRole("heading", { level: 1, name: "Pregnancy-safe ingredient checklist" })).toBeVisible()
  await expect(page.getByText(/Retinoids, including both prescription acne treatments/i)).toHaveCount(0)
  await expect(page.getByText(/AAD khuyên tránh retinoid, hydroquinone/i).first()).toBeVisible()
  await expect(page.getByRole("heading", { name: "Ranh giới cần dừng hoặc đi khám" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Nguồn tham khảo" })).toBeVisible()
  await expect(page.getByRole("link", { name: /Dermatologist-approved pregnancy skin care/i })).toHaveAttribute("href", /aad\.org/)
  await expect(page.getByText("Sản phẩm nên xem sau khi đọc tiêu chí")).toHaveCount(0)
})

test("legacy sample article URLs redirect to a sourced canonical article", async ({ page }) => {
  await page.goto("/blog/top-5-serum-phuc-hoi-da-2026")

  await expect(page).toHaveURL(/\/blog\/cach-tinh-gia-tri-that-cua-mot-serum$/)
  await expect(page.getByRole("heading", { level: 1, name: "Cách tính giá trị thật của một serum" })).toBeVisible()
})
