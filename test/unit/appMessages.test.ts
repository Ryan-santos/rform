import { describe, expect, it, vi } from "vitest";

import {
    flattenMessages,
    messageParams,
    resolveAppMessages,
    trTemplate
} from "../../src/appMessages";

describe("flattenMessages", () => {
    it("flattens nested objects into dotted paths", () => {
        expect(flattenMessages({ form: { nome: "Nome", max: "Até {n}" } })).toEqual({
            "form.nome": "Nome",
            "form.max": "Até {n}"
        });
    });

    it("drops anything that is not a string leaf", () => {
        expect(flattenMessages({ a: "x", b: 1, c: null, d: [] })).toEqual({ a: "x" });
    });

    it("returns an empty map for a non-object", () => {
        expect(flattenMessages("nope")).toEqual({});
        expect(flattenMessages(null)).toEqual({});
    });
});

describe("messageParams", () => {
    it("finds named params", () => {
        expect(messageParams("Até {n} de {total}")).toEqual({
            named: ["n", "total"],
            plural: false
        });
    });

    it("tolerates spaces inside the braces", () => {
        expect(messageParams("Até { n }")).toEqual({ named: ["n"], plural: false });
    });

    it("does not repeat a param used twice", () => {
        expect(messageParams("{a} e {a}")).toEqual({ named: ["a"], plural: false });
    });

    it("ignores a vue-i18n literal interpolation", () => {
        expect(messageParams("{'{{contato_nome}}'}")).toEqual({ named: [], plural: false });
    });

    it("detects a plural", () => {
        expect(messageParams("um item | {n} itens")).toEqual({ named: ["n"], plural: true });
    });

    it("reports neither for a plain message", () => {
        expect(messageParams("Nome")).toEqual({ named: [], plural: false });
    });
});

describe("trTemplate", () => {
    it("loose is the whole string type", () => {
        const out = trTemplate({ kind: "loose" });

        expect(out).toContain("export type TrInput = string;");
        expect(out).not.toContain("interface AppMessages");
    });

    it("moduleOnly keeps the rigour with no app key to offer", () => {
        const out = trTemplate({ kind: "moduleOnly" });

        expect(out).toContain("export type TrInput = ModuleKey | Literal;");
        expect(out).not.toContain("interface AppMessages");
    });

    it("strict emits one entry per key, typed by its params", () => {
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

    it("falls back to moduleOnly when the app file has no key at all", () => {
        expect(trTemplate({ kind: "strict", messages: {} })).toContain(
            "export type TrInput = ModuleKey | Literal;"
        );
    });

    it("every mode declares Literal and ModuleKey", () => {
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
    it("is loose with no @nuxtjs/i18n at all", async () => {
        const warn = vi.fn();

        expect(
            await resolveAppMessages({ hasI18n: false, rootDir: "/app", read: read({}), warn })
        ).toEqual({ kind: "loose" });

        // Not a degradation: there is no i18n to be strict about.
        expect(warn).not.toHaveBeenCalled();
    });

    it("is moduleOnly when i18n declares no file — and says nothing", async () => {
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

    it("reads the defaultLocale's json and flattens it", async () => {
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

    it("degrades on a .ts file, naming it and the reason", async () => {
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

    it("degrades on yaml the same way", async () => {
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

    it("degrades when the json is there but will not parse", async () => {
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

    it("takes the `{ path }` form of `file` and the `files` array", async () => {
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

    it("falls back to the first locale when defaultLocale names none", async () => {
        const mode = await resolveAppMessages({
            hasI18n: true,
            rootDir: "/app",
            config: { locales: [{ code: "pt-BR", file: "pt-BR.json" }] },
            read: read({ "pt-BR.json": `{"a":"A"}` })
        });

        expect(mode).toEqual({ kind: "strict", messages: { a: "A" } });
    });
});