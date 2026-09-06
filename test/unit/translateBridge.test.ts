import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const nuxtApp: { $i18n?: unknown } = {};

vi.mock("#app", async () => {
    const actual = await vi.importActual<typeof import("../stubs/app")>("../stubs/app");

    return { ...actual, tryUseNuxtApp: () => (nuxtApp.$i18n ? nuxtApp : undefined) };
});

describe("o motor com ponte", () => {
    it("não busca o @intlify — o corte do bundle é estrutural", () => {
        const source = readFileSync(
            fileURLToPath(new URL("../../src/runtime/translate/bridge.ts", import.meta.url)),
            "utf8"
        );

        expect(source).not.toContain("@intlify");
    });
});

describe("o motor com ponte, traduzindo", () => {
    beforeEach(() => {
        const locale = ref("pt-BR");

        nuxtApp.$i18n = {
            locale,
            t: (key: string, params?: unknown) =>
                `[${locale.value}] ${key}${params === undefined ? "" : ` ${JSON.stringify(params)}`}`
        };
    });

    it("tira o `~~` e devolve o literal", async () => {
        const { tr } = await import("../../src/runtime/translate/bridge");

        expect(tr("~~Nome")).toBe("Nome");
        expect(tr("~~  Nome")).toBe("Nome");
    });

    it("manda todo o resto pro $i18n.t, chaves do módulo inclusive", async () => {
        const { tr } = await import("../../src/runtime/translate/bridge");

        expect(tr("form.nome")).toBe("[pt-BR] form.nome");
        expect(tr("rform.fields.array.add")).toBe("[pt-BR] rform.fields.array.add");
    });

    it("repassa os params direto", async () => {
        const { tr } = await import("../../src/runtime/translate/bridge");

        expect(tr({ key: "form.max", params: { n: 30 } })).toBe(`[pt-BR] form.max {"n":30}`);
        expect(tr({ key: "table.items", params: 3 })).toBe("[pt-BR] table.items 3");
    });

    it("o useTr expõe o ref de locale do próprio app", async () => {
        const { useTr } = await import("../../src/runtime/translate/bridge");
        const { tr, locale } = useTr();

        locale.value = "en";
        expect(tr("form.nome")).toBe("[en] form.nome");
    });

    it("entrega a escolha de plural ao $i18n como opção", async () => {
        const { tr } = await import("../../src/runtime/translate/bridge");

        expect(tr({ key: "form.itens", params: { n: 1 } })).toBe(`[pt-BR] form.itens {"n":1}`);
    });
});