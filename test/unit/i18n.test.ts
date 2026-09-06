import { describe, expect, it } from "vitest";

import en from "../../src/runtime/locales/en";
import ptBR from "../../src/runtime/locales/pt-BR";
import { matchLocale } from "../../src/runtime/utils/i18n";

describe("matchLocale", () => {
    const available = ["pt-BR", "en"];

    it("matches an exact code", () => {
        expect(matchLocale("pt-BR", available)).toBe("pt-BR");
        expect(matchLocale("en", available)).toBe("en");
    });

    it("matches case-insensitively", () => {
        expect(matchLocale("pt-br", available)).toBe("pt-BR");
    });

    it("widens a bare language to the region that ships", () => {
        expect(matchLocale("pt", available)).toBe("pt-BR");
    });

    it("narrows a region to the bare language that ships", () => {
        expect(matchLocale("en-GB", available)).toBe("en");
    });

    it("prefers an exact bare match over a regional one", () => {
        expect(matchLocale("en", ["en-GB", "en"])).toBe("en");
    });

    it("returns undefined for a language nothing covers", () => {
        expect(matchLocale("ja", available)).toBeUndefined();
        expect(matchLocale(undefined, available)).toBeUndefined();
    });
});

const keys = (messages: unknown, prefix = ""): string[] =>
    Object.entries(messages as Record<string, unknown>).flatMap(([key, value]) =>
        typeof value === "string" ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`)
    );

describe("the built-in packs", () => {
    it("agree on every key, so no locale silently falls back", () => {
        expect(keys(en).sort()).toEqual(keys(ptBR).sort());
    });

    it("keeps the top level to the four namespaces the prefix can produce", () => {
        /**
         * `fields.*` and `utils.*` are what `prefixText` writes, one per
         * component directory — which is what keeps a field and a util of the
         * same name (`Calendar` is both today) from sharing a key. `presets`
         * and `formats` are the two shared spaces nothing prefixes.
         */
        const owners = [
            "fields", // components/fields/**
            "formats", // shared
            "presets", // presets/rules/**
            "utils" // components/utils/**
        ];

        expect([...new Set(keys(ptBR).map((key) => key.split(".")[0]!))].sort()).toEqual(owners);
    });
});