import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const nuxtApp: { $i18n?: unknown } = {};

vi.mock("#app", async () => {
    const actual = await vi.importActual<typeof import("../stubs/app")>("../stubs/app");

    return { ...actual, tryUseNuxtApp: () => (nuxtApp.$i18n ? nuxtApp : undefined) };
});

describe("the bridge engine", () => {
    it("does not reach for @intlify — the bundle cut is structural", () => {
        const source = readFileSync(
            fileURLToPath(new URL("../../src/runtime/translate/bridge.ts", import.meta.url)),
            "utf8"
        );

        expect(source).not.toContain("@intlify");
    });
});

describe("the bridge engine, translating", () => {
    beforeEach(() => {
        const locale = ref("pt-BR");

        nuxtApp.$i18n = {
            locale,
            t: (key: string, params?: unknown) =>
                `[${locale.value}] ${key}${params === undefined ? "" : ` ${JSON.stringify(params)}`}`
        };
    });

    it("strips `~~` and returns the literal", async () => {
        const { tr } = await import("../../src/runtime/translate/bridge");

        expect(tr("~~Nome")).toBe("Nome");
        expect(tr("~~  Nome")).toBe("Nome");
    });

    it("sends everything else to $i18n.t, module keys included", async () => {
        const { tr } = await import("../../src/runtime/translate/bridge");

        expect(tr("form.nome")).toBe("[pt-BR] form.nome");
        expect(tr("rform.fields.array.add")).toBe("[pt-BR] rform.fields.array.add");
    });

    it("passes params straight through", async () => {
        const { tr } = await import("../../src/runtime/translate/bridge");

        expect(tr({ key: "form.max", params: { n: 30 } })).toBe(`[pt-BR] form.max {"n":30}`);
        expect(tr({ key: "table.items", params: 3 })).toBe("[pt-BR] table.items 3");
    });

    it("useTr exposes the app's own locale ref", async () => {
        const { useTr } = await import("../../src/runtime/translate/bridge");
        const { tr, locale } = useTr();

        locale.value = "en";
        expect(tr("form.nome")).toBe("[en] form.nome");
    });

    it("hands the plural choice to $i18n as an option", async () => {
        const { tr } = await import("../../src/runtime/translate/bridge");

        expect(tr({ key: "form.itens", params: { n: 1 } })).toBe(`[pt-BR] form.itens {"n":1}`);
    });
});