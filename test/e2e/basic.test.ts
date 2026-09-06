import { fileURLToPath } from "node:url";

import { $fetch, setup } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

const fixture = fileURLToPath(new URL("../fixtures/basic", import.meta.url));

describe("e2e SSR: basic fixture", async () => {
    await setup({
        rootDir: fixture
    });

    it("renders the index page server-side with the form", async () => {
        const html = await $fetch<string>("/");
        expect(html).toContain("rform fixture");
        expect(html).toContain('data-testid="name-input"');
        expect(html).toContain('data-testid="name-value"');
    });

    it("renders an input named 'name' from the RText field", async () => {
        const html = await $fetch<string>("/");
        expect(html).toMatch(/<input[^>]*name="name"/);
    });
});