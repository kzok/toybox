import { expect, test } from "@playwright/test";

test("renders the header menus", async ({ page }) => {
  await page.goto("/ss-edit/");

  await expect(page.getByRole("button", { name: "File" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
});
