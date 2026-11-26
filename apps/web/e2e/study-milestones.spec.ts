import { expect, test } from "@playwright/test";

/*
 * A study's dated steps: newest first, each with its own anchor and, when the
 * owner announced it, a link to the post. The FAI role links its post too.
 */
test.describe("study milestones", () => {
  test("Transforme-se lists its steps, newest first, linked to the posts", async ({ page }) => {
    await page.goto("/pt-br/education#senac-systems-programmer-2026-02-20");
    const steps = page.locator("#senac-systems-programmer ol > li");
    await expect(steps).toHaveCount(4);
    await expect(steps.first()).toContainText("Comecei a segunda fase");
    await expect(steps.last()).toContainText("Informática Básica");
    await expect(page.locator("#senac-systems-programmer-2026-02-20")).toBeInViewport();

    const post = steps.first().getByRole("link", { name: /Post no LinkedIn/ });
    await expect(post).toHaveAttribute("href", /linkedin\.com\/feed\/update\/urn:li:activity:7430650420630274048/);
  });

  test("the FAI role links the post about the selection", async ({ page }) => {
    await page.goto("/en-us/career/fai-ufscar-2026");
    await expect(page.locator("section[aria-labelledby=evidence]").getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
      "href",
      /urn:li:activity:7448425848514453504/
    );
  });

  test("the FAI role lists computer vision and OCR", async ({ page }) => {
    await page.goto("/en-us/career/fai-ufscar-2026");
    const technologies = page.locator("section[aria-labelledby=technologies]");
    await expect(technologies).toContainText("Computer vision");
    await expect(technologies).toContainText("OCR");
  });
});
