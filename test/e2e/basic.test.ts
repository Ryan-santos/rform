import { fileURLToPath } from "node:url";

import { $fetch, setup } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

const fixture = fileURLToPath(new URL("../fixtures/basic", import.meta.url));

describe("e2e SSR: fixture basic", async () => {
    await setup({
        rootDir: fixture
    });

    it("renderiza a index no servidor, com o form", async () => {
        const html = await $fetch<string>("/");
        expect(html).toContain("rform fixture");
        expect(html).toContain('data-testid="name-input"');
        expect(html).toContain('data-testid="name-value"');
    });

    it("renderiza um input chamado 'name' a partir do RText", async () => {
        const html = await $fetch<string>("/");
        expect(html).toMatch(/<input[^>]*name="name"/);
    });

    it("renderiza o painel do RSelect dentro do #teleports, e não dentro do campo", async () => {
        const html = await $fetch<string>("/");
        const at = html.indexOf('id="teleports"');

        expect(at).toBeGreaterThan(-1);
        expect(html.slice(0, at)).not.toContain("RUtilsDropdown");
        expect(html.slice(at)).toContain("RUtilsDropdown");
    });
});