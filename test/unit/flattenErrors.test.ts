import { describe, expect, it } from "vitest";

import flattenErrors, { isErrorsObject } from "../../src/runtime/utils/flattenErrors";

describe("flattenErrors", () => {
    it("achata a forma aninhada no id pontilhado do campo", () => {
        expect(flattenErrors({ endereco: { cep: "CEP inválido" } })).toEqual({
            "endereco.cep": "CEP inválido"
        });
    });

    it("aceita a chave já pontilhada", () => {
        expect(flattenErrors({ "endereco.cep": "CEP inválido" })).toEqual({
            "endereco.cep": "CEP inválido"
        });
    });

    it("aceita as duas formas misturadas", () => {
        expect(
            flattenErrors({ endereco: { "numero.interno": "faltando" }, nome: "Já existe" })
        ).toEqual({
            "endereco.numero.interno": "faltando",
            nome: "Já existe"
        });
    });

    it("reduz um string[] ao primeiro item", () => {
        expect(flattenErrors({ nome: ["Já existe", "muito curto"] })).toEqual({
            nome: "Já existe"
        });
    });

    it("casa o índice de array com o id que o RArray monta", () => {
        expect(flattenErrors({ itens: { 0: { nome: "obrigatório" } } })).toEqual({
            "itens.0.nome": "obrigatório"
        });

        expect(flattenErrors({ "itens.0.nome": "obrigatório" })).toEqual({
            "itens.0.nome": "obrigatório"
        });
    });

    it("devolve um mapa vazio para entrada ausente", () => {
        expect(flattenErrors(undefined)).toEqual({});
    });

    it("ignora valor que não é string nem objeto", () => {
        expect(flattenErrors({ nome: 42, idade: null, ok: "erro" } as never)).toEqual({
            ok: "erro"
        });
    });

    it("ignora um array sem nenhuma string", () => {
        expect(flattenErrors({ nome: [] } as never)).toEqual({});
    });
});

describe("isErrorsObject", () => {
    it("aceita objeto simples", () => {
        expect(isErrorsObject({ nome: "Já existe" })).toBe(true);
        expect(isErrorsObject({})).toBe(true);
    });

    it("recusa null, array e string", () => {
        expect(isErrorsObject(null)).toBe(false);
        expect(isErrorsObject(["erro"])).toBe(false);
        expect(isErrorsObject("erro")).toBe(false);
        expect(isErrorsObject(undefined)).toBe(false);
    });
});