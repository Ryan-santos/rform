import { describe, expect, it, vi } from "vitest";

import {
    flattenMessages,
    messageParams,
    resolveAppMessages,
    trTemplate
} from "../../src/appMessages";

describe("flattenMessages", () => {
    it("achata objeto aninhado em caminho pontilhado", () => {
        expect(flattenMessages({ form: { nome: "Nome", max: "Até {n}" } })).toEqual({
            "form.nome": "Nome",
            "form.max": "Até {n}"
        });
    });

    it("descarta o que não é folha string", () => {
        expect(flattenMessages({ a: "x", b: 1, c: null, d: [] })).toEqual({ a: "x" });
    });

    it("devolve mapa vazio para o que não é objeto", () => {
        expect(flattenMessages("nope")).toEqual({});
        expect(flattenMessages(null)).toEqual({});
    });
});

describe("messageParams", () => {
    it("acha os params nomeados", () => {
        expect(messageParams("Até {n} de {total}")).toEqual({
            named: ["n", "total"],
            plural: false
        });
    });

    it("tolera espaço dentro das chaves", () => {
        expect(messageParams("Até { n }")).toEqual({ named: ["n"], plural: false });
    });

    it("não repete um param usado duas vezes", () => {
        expect(messageParams("{a} e {a}")).toEqual({ named: ["a"], plural: false });
    });

    it("ignora uma interpolação literal do vue-i18n", () => {
        expect(messageParams("{'{{contato_nome}}'}")).toEqual({ named: [], plural: false });
    });

    it("detecta um plural", () => {
        expect(messageParams("um item | {n} itens")).toEqual({ named: ["n"], plural: true });
    });

    it("não reporta nenhum dos dois numa mensagem simples", () => {
        expect(messageParams("Nome")).toEqual({ named: [], plural: false });
    });
});

describe("trTemplate", () => {
    it("loose é o tipo string inteiro", () => {
        const out = trTemplate({ kind: "loose" });

        expect(out).toContain("export type TrInput = string;");
        expect(out).not.toContain("interface AppMessages");
    });

    it("moduleOnly mantém o rigor sem chave do app a oferecer", () => {
        const out = trTemplate({ kind: "moduleOnly" });

        expect(out).toContain("export type TrInput = ModuleKey | Literal;");
        expect(out).not.toContain("interface AppMessages");
    });

    it("strict emite uma entrada por chave, tipada pelos params dela", () => {
        const out = trTemplate({
            kind: "strict",
            messages: {
                "form.nome": "Nome",
                "form.max": "Até {n}",
                "table.items": "um | muitos",
                "table.left": "{n} de {total} | {n} de {total}"
            }
        });

        expect(out).toContain(`    "form.nome": never;`);
        expect(out).toContain(`    "form.max": { n: Interp };`);
        expect(out).toContain(`    "table.items": number;`);
        expect(out).toContain(`    "table.left": { n: Interp; total: Interp } | number;`);
        expect(out).toContain(
            "export type TrInput = Paramless | ModuleKey | WithParams | Literal;"
        );
    });

    it("cai em moduleOnly quando o arquivo do app não tem chave nenhuma", () => {
        expect(trTemplate({ kind: "strict", messages: {} })).toContain(
            "export type TrInput = ModuleKey | Literal;"
        );
    });

    it("todo modo declara Literal e ModuleKey", () => {
        for (const mode of [
            { kind: "loose" } as const,
            { kind: "moduleOnly" } as const,
            { kind: "strict", messages: {} } as const
        ]) {
            const out = trTemplate(mode);

            expect(out).toContain("export type Literal = `~~${string}`;");
            expect(out).toContain("export type ModuleKey = `rform.${MessageKey}`;");
        }
    });
});

const read = (files: Record<string, string>) => (path: string) => {
    const hit = Object.entries(files).find(([name]) => path.endsWith(name));

    if (!hit) {
        return Promise.reject(new Error("ENOENT"));
    }

    return Promise.resolve(hit[1]);
};

describe("resolveAppMessages", () => {
    it("é loose sem nenhum @nuxtjs/i18n", async () => {
        const warn = vi.fn();

        expect(
            await resolveAppMessages({ hasI18n: false, rootDir: "/app", read: read({}), warn })
        ).toEqual({ kind: "loose" });

        // Não é degradação: não há i18n sobre o que ser rigoroso.
        expect(warn).not.toHaveBeenCalled();
    });

    it("é moduleOnly quando o i18n não declara arquivo — e não avisa nada", async () => {
        const warn = vi.fn();

        const mode = await resolveAppMessages({
            hasI18n: true,
            rootDir: "/app",
            config: {
                defaultLocale: "pt-BR",
                locales: [{ code: "pt-BR" }, { code: "en" }]
            },
            read: read({}),
            warn
        });

        expect(mode).toEqual({ kind: "moduleOnly" });
        expect(warn).not.toHaveBeenCalled();
    });

    it("lê o json do defaultLocale e o achata", async () => {
        const mode = await resolveAppMessages({
            hasI18n: true,
            rootDir: "/app",
            config: {
                defaultLocale: "pt-BR",
                langDir: "locales",
                locales: [
                    { code: "pt-BR", file: "pt-BR.json" },
                    { code: "en", file: "en.json" }
                ]
            },
            read: read({ "pt-BR.json": `{"form":{"nome":"Nome"}}` })
        });

        expect(mode).toEqual({ kind: "strict", messages: { "form.nome": "Nome" } });
    });

    it("degrada num arquivo .ts, nomeando ele e o motivo", async () => {
        const warn = vi.fn();

        const mode = await resolveAppMessages({
            hasI18n: true,
            rootDir: "/app",
            config: {
                defaultLocale: "pt-BR",
                langDir: "locales",
                locales: [{ code: "pt-BR", file: "pt-BR.ts" }]
            },
            read: read({}),
            warn
        });

        expect(mode).toEqual({ kind: "loose" });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("pt-BR.ts"));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("formato"));
    });

    it("degrada em yaml do mesmo jeito", async () => {
        const warn = vi.fn();

        const mode = await resolveAppMessages({
            hasI18n: true,
            rootDir: "/app",
            config: {
                defaultLocale: "pt-BR",
                locales: [{ code: "pt-BR", file: "pt-BR.yaml" }]
            },
            read: read({}),
            warn
        });

        expect(mode).toEqual({ kind: "loose" });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("pt-BR.yaml"));
    });

    it("degrada quando o json existe mas não parseia", async () => {
        const warn = vi.fn();

        const mode = await resolveAppMessages({
            hasI18n: true,
            rootDir: "/app",
            config: {
                defaultLocale: "pt-BR",
                locales: [{ code: "pt-BR", file: "pt-BR.json" }]
            },
            read: read({ "pt-BR.json": "{ nope" }),
            warn
        });

        expect(mode).toEqual({ kind: "loose" });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("pt-BR.json"));
    });

    it("aceita a forma `{ path }` de `file` e o array `files`", async () => {
        const mode = await resolveAppMessages({
            hasI18n: true,
            rootDir: "/app",
            config: {
                defaultLocale: "pt-BR",
                locales: [{ code: "pt-BR", files: [{ path: "base.json" }, "extra.json"] }]
            },
            read: read({ "base.json": `{"a":"A"}`, "extra.json": `{"b":"B"}` })
        });

        expect(mode).toEqual({ kind: "strict", messages: { a: "A", b: "B" } });
    });

    it("cai no primeiro locale quando defaultLocale não nomeia nenhum", async () => {
        const mode = await resolveAppMessages({
            hasI18n: true,
            rootDir: "/app",
            config: { locales: [{ code: "pt-BR", file: "pt-BR.json" }] },
            read: read({ "pt-BR.json": `{"a":"A"}` })
        });

        expect(mode).toEqual({ kind: "strict", messages: { a: "A" } });
    });
});