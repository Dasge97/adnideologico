import { expect, test } from "@playwright/test";

test("landing muestra mensaje principal y abre resultado de ejemplo", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Seguro que sabes como piensas politicamente?" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Ver ejemplo" }).click();

  await expect(page.getByRole("heading", { name: "Tu ADN ideologico" })).toBeVisible();
  await expect(page.getByText("Este resultado no te encasilla")).toBeVisible();
});
