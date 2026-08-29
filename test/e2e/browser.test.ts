import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createPage, setup } from "@nuxt/test-utils/e2e";

const fixture = fileURLToPath(new URL("../fixtures/basic", import.meta.url));

describe("e2e browser: basic fixture", async () => {
    await setup({
        rootDir: fixture,
        browser: true
    });

    it("updates the displayed model when the input is typed", async () => {
        const page = await createPage("/");
        await page.locator('input[name="name"]').fill("Ada");
        await page.waitForFunction(() => {
            const el = document.querySelector('[data-testid="name-value"]');
            return el?.textContent?.includes("Ada");
        });
        const text = await page.getByTestId("name-value").textContent();
        expect(text).toContain("Ada");
    });
});