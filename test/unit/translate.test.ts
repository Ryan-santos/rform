import { describe, expect, it } from "vitest";

import {
    tr as standaloneTr,
    useTr as standaloneUseTr
} from "../../src/runtime/translate/standalone";
import { normalize } from "../../src/runtime/utils/i18n";

describe("normalize", () => {
    it("transforma string pelada em chave sem params", () => {
        expect(normalize("form.nome")).toEqual({ key: "form.nome" });
    });

    it("mantém key e params de uma entrada objeto", () => {
        expect(normalize({ key: "form.max", params: { n: 30 } })).toEqual({
            key: "form.max",
            params: { n: 30 }
        });
    });

    it("aceita número como params, que é a escolha de plural", () => {
        expect(normalize({ key: "table.items", params: 3 })).toEqual({
            key: "table.items",
            params: 3
        });
    });

    it("trata null e undefined como a chave vazia", () => {
        expect(normalize(null)).toEqual({ key: "" });
        expect(normalize(undefined)).toEqual({ key: "" });
    });
});

describe("o motor sem ponte", () => {
    it("resolve uma chave do módulo contra o pack embutido", () => {
        expect(standaloneTr("rform.presets.rules.required")).toBe("Campo obrigatório.");
    });

    it("interpola params nomeados", () => {
        expect(standaloneTr({ key: "rform.presets.rules.min.number", params: { min: 3 } })).toBe(
            "Valor mínimo: 3."
        );
    });

    it("é a identidade para tudo que não é chave do módulo", () => {
        expect(standaloneTr("form.nome")).toBe("form.nome");
        expect(standaloneTr("Nome")).toBe("Nome");
    });

    it("é a identidade para `~~` também — a assimetria aceita", () => {
        expect(standaloneTr("~~Nome")).toBe("~~Nome");
    });

    it("devolve a chave inteira quando o pack do módulo não a tem", () => {
        expect(standaloneTr("rform.nao.existe")).toBe("rform.nao.existe");
    });

    it("segue o ref de locale que o useTr devolve", () => {
        const { tr, locale } = standaloneUseTr();

        locale.value = "en";
        expect(tr("rform.presets.rules.required")).toBe("Required field.");

        locale.value = "pt-BR";
        expect(tr("rform.presets.rules.required")).toBe("Campo obrigatório.");
    });

    it("alarga um code de língua pelada para o pack que existe", () => {
        const { tr, locale } = standaloneUseTr();

        locale.value = "en-GB";
        expect(tr("rform.presets.rules.required")).toBe("Required field.");

        locale.value = "pt-BR";
    });

    it("deixa um número nomeado escolher a forma do plural", () => {
        expect(standaloneTr({ key: "rform.presets.rules.min.length", params: { min: 1 } })).toBe(
            "Mínimo de 1 caractere."
        );
        expect(standaloneTr({ key: "rform.presets.rules.min.length", params: { min: 4 } })).toBe(
            "Mínimo de 4 caracteres."
        );
    });
});