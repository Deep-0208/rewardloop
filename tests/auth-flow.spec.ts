import { test, expect } from "@playwright/test";

test.describe("Authentication Flow E2E", () => {
  test("should load login screen and render required branding", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("RewardLoop")).toBeVisible();
    await expect(
      page.getByPlaceholder("Enter 10-digit number"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeDisabled();
  });

  test("should allow typing valid phone and transitioning to OTP step", async ({
    page,
  }) => {
    await page.goto("/login");

    const phoneInput = page.getByPlaceholder("Enter 10-digit number");
    await phoneInput.fill("9999988888");

    const continueBtn = page.getByRole("button", {
      name: "Continue",
      exact: true,
    });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Verify transition to OTP state
    await expect(page.getByText("Verify your number")).toBeVisible({
      timeout: 10000,
    });
  });
});
