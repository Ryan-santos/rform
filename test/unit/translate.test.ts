import { describe, expect, it } from "vitest";

import {
    tr as standaloneTr,
    useTr as standaloneUseTr
} from "../../src/runtime/translate/standalone";
import { normalize } from "../../src/runtime/utils/i18n";

describe("normalize", () => {
    it("turns a bare string into a key with no params", () => {
        expect(normalize("form.nome")).toEqual({ key: "form.nome" });
    });

    it("keeps key and params of an object input", () => {
        expect(normalize({ key: "form.max", params: { n: 30 } })).toEqual({
            key: "form.max",
            params: { n: 30 }
        });
    });

    it("accepts a number as params, which is the plural choice", () => {
        expect(normalize({ key: "table.items", params: 3 })).toEqual({
            key: "table.items",
            params: 3
        });
    });

    it("treats null and undefined as the empty key", () => {
        expect(normalize(null)).toEqual({ key: "" });
        expect(normalize(undefined)).toEqual({ key: "" });
    });
});

describe("the standalone engine", () => {
    it("resolves a module key against the built-in pack", () => {
        expect(standaloneTr("rform.presets.rules.required")).toBe("Campo obrigatório.");
    });

    it("interpolates named params", () => {
        expect(standaloneTr({ key: "rform.presets.rules.min.number", params: { min: 3 } })).toBe(
            "Valor mínimo: 3."
        );
    });

    it("is the identity for anything that is not a module key", () => {
        expect(standaloneTr("form.nome")).toBe("form.nome");
        expect(standaloneTr("Nome")).toBe("Nome");
    });

    it("is the identity for `~~` too — the asymmetry decision 9 accepts", () => {
        expect(standaloneTr("~~Nome")).toBe("~~Nome");
    });

    it("hands the full key back when the module pack misses it", () => {
        expect(standaloneTr("rform.nao.existe")).toBe("rform.nao.existe");
    });

    it("follows the locale ref returned by useTr", () => {
        const { tr, locale } = standaloneUseTr();

        locale.value = "en";
        expect(tr("rform.presets.rules.required")).toBe("Required field.");

        locale.value = "pt-BR";
        expect(tr("rform.presets.rules.required")).toBe("Campo obrigatório.");
    });

    it("widens a bare language code to the pack that ships", () => {
        const { tr, locale } = standaloneUseTr();

        locale.value = "en-GB";
        expect(tr("rform.presets.rules.required")).toBe("Required field.");

        locale.value = "pt-BR";
    });

    it("lets a named number choose the plural form", () => {
        expect(standaloneTr({ key: "rform.presets.rules.min.length", params: { min: 1 } })).toBe(
            "Mínimo de 1 caractere."
        );
        expect(standaloneTr({ key: "rform.presets.rules.min.length", params: { min: 4 } })).toBe(
            "Mínimo de 4 caracteres."
        );
    });
});