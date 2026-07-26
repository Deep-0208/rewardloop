import { test, expect } from "@playwright/test";

test("Golden Path: Login, New Visit, Customer, Service+Product, Checkout", async ({
  page,
}) => {
  // 1. Start at login explicitly to ensure we authenticate
  await page.goto("/login");

  // 2. Authentication
  await page.getByPlaceholder("Enter 10-digit number").fill("9023833730");
  await page
    .getByRole("button", { name: "Continue", exact: true })
    .first()
    .click();

  // OTP step
  await expect(page.getByText("Verify your number")).toBeVisible({
    timeout: 10000,
  });

  // Fill OTP
  await page.keyboard.type("123456");

  // Click Verify & Continue (fixed button name)
  await page.getByRole("button", { name: "Verify & Continue" }).click();

  // Wait for the URL to change away from login
  await page.waitForURL((url) => !url.toString().includes("/login"), {
    timeout: 15000,
  });

  // Check where we landed
  if (page.url().includes("/onboarding/business")) {
    await page.getByLabel("Business Name").fill("Test Salon");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click(); // Skip/next on rules
    await page.getByRole("button", { name: "Complete Setup" }).click();
  }

  // 3. Wait for app load (Dashboard or Onboarding)
  await page.waitForURL(
    (url) =>
      url.toString().includes("/dashboard") ||
      url.toString().includes("/onboarding"),
    { timeout: 15000 },
  );

  // Navigate to visit if not already there
  await page.goto("/visit");

  // 4. Customer Selection
  await page.getByPlaceholder("9000000000").fill("9023833730");
  // Let it auto-search when 10 digits are entered
  // Wait for "Continue" button to appear (meaning customer was found or new customer form is ready)
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Continue" }).click();

  // If New Customer form appears
  const isNewCustomer = await page
    .getByPlaceholder("e.g. John Doe")
    .isVisible();
  if (isNewCustomer) {
    await page.getByPlaceholder("e.g. John Doe").fill("Test User");
    await page.getByRole("button", { name: "Save & Continue" }).click();
  }

  // 5. Catalog Selection
  // Services
  await page.getByRole("tab", { name: "Services" }).click();
  // Add first service (from seed.sql)
  await page.getByRole("button", { name: /Men's Haircut/ }).click();

  // Switch to Products tab
  await page.getByRole("tab", { name: "Products" }).click();
  // Add first product (from DOM)
  await page.getByRole("button", { name: /Herbal Shampoo/ }).click();

  await page
    .getByRole("button", { name: "Continue to Reward Calculation" })
    .click();

  // 6. Reward Redemption
  await expect(page.getByRole("heading", { name: "Rewards" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to Review" }).click();

  // 8. Complete Visit
  await expect(page.getByText("FINAL PAY")).toBeVisible();
  // Select Cash (Default)
  await page.getByRole("button", { name: "Complete Visit" }).click();

  // 9. Success Verification
  await page.waitForURL((url) => url.toString().includes("/dashboard"), {
    timeout: 10000,
  });
});
