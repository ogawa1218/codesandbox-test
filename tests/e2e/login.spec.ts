import { expect, test } from "@playwright/test";

test.describe("login", () => {
  test("renders the login form and rejects invalid credentials", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();

    await page.getByLabel("メールアドレス").fill("nobody@example.com");
    await page.getByLabel("パスワード").fill("wrong-password");
    await page.getByRole("button", { name: /ログイン/ }).click();

    await expect(
      page.getByText(/メールアドレスまたはパスワードが正しくありません/),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("redirects unauthenticated users from /dashboard", async ({ page }) => {
    const res = await page.goto("/dashboard");
    expect(res?.url()).toContain("/login");
  });
});
