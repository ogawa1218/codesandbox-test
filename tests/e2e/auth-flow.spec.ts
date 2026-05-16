import { expect, test } from "@playwright/test";

/**
 * E2E for the 3 critical scenarios. Requires:
 *  - PLAYWRIGHT_MANAGER_EMAIL / PLAYWRIGHT_MANAGER_PASSWORD
 *  - PLAYWRIGHT_EMPLOYEE_EMAIL / PLAYWRIGHT_EMPLOYEE_PASSWORD
 * If env vars are missing the test is skipped.
 */
const manager = {
  email: process.env.PLAYWRIGHT_MANAGER_EMAIL,
  password: process.env.PLAYWRIGHT_MANAGER_PASSWORD,
};
const employee = {
  email: process.env.PLAYWRIGHT_EMPLOYEE_EMAIL,
  password: process.env.PLAYWRIGHT_EMPLOYEE_PASSWORD,
};

test.describe("manager flow", () => {
  test.skip(
    !manager.email || !manager.password,
    "PLAYWRIGHT_MANAGER_* env vars not set",
  );

  test("logs in, sees the dashboard KPI cards", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill(manager.email!);
    await page.getByLabel("パスワード").fill(manager.password!);
    await page.getByRole("button", { name: /ログイン/ }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });

    await expect(page.getByText("売上(税抜)")).toBeVisible();
    await expect(page.getByText("予算達成率")).toBeVisible();
    await expect(page.getByText("人件費")).toBeVisible();
  });

  test("can create a position from settings", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill(manager.email!);
    await page.getByLabel("パスワード").fill(manager.password!);
    await page.getByRole("button", { name: /ログイン/ }).click();
    await page.waitForURL(/\/dashboard$/);
    await page.goto("/settings");
    const name = `E2E-${Date.now()}`;
    await page.getByPlaceholder("ポジション名(例: ホール)").fill(name);
    await page.getByRole("button", { name: "追加" }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("employee flow", () => {
  test.skip(
    !employee.email || !employee.password,
    "PLAYWRIGHT_EMPLOYEE_* env vars not set",
  );

  test("sees own shifts and a LINE share button", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill(employee.email!);
    await page.getByLabel("パスワード").fill(employee.password!);
    await page.getByRole("button", { name: /ログイン/ }).click();
    await page.waitForURL(/\/my-shifts$/, { timeout: 15_000 });

    await expect(
      page.getByRole("heading", { name: "マイシフト" }),
    ).toBeVisible();
  });
});
