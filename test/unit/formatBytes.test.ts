import { describe, expect, it } from "vitest";

import formatBytes from "../../src/runtime/utils/formatBytes";

describe("formatBytes", () => {
    it("devolve valor e unidade, nunca a string montada", () => {
        // A unidade é chave de `text.bytes.*`, e quem traduz é o componente.
        expect(formatBytes(512)).toEqual({ value: 512, unit: "b" });
    });

    it("zero fica em bytes, para o componente escolher o `text.zero`", () => {
        expect(formatBytes(0)).toEqual({ value: 0, unit: "b" });
    });

    it("sobe de unidade no limite de 1024", () => {
        expect(formatBytes(1023)).toEqual({ value: 1023, unit: "b" });
        expect(formatBytes(1024)).toEqual({ value: 1, unit: "kb" });
        expect(formatBytes(1024 ** 2)).toEqual({ value: 1, unit: "mb" });
        expect(formatBytes(1024 ** 3)).toEqual({ value: 1, unit: "gb" });
        expect(formatBytes(1024 ** 4)).toEqual({ value: 1, unit: "tb" });
    });

    it("não passa da maior unidade", () => {
        expect(formatBytes(1024 ** 5)).toEqual({ value: 1024, unit: "tb" });
    });

    it("arredonda em uma casa, e não perde a meia unidade", () => {
        expect(formatBytes(1536)).toEqual({ value: 1.5, unit: "kb" });
        expect(formatBytes(1024 * 1.25)).toEqual({ value: 1.3, unit: "kb" });
    });

    it("valor inválido não vira NaN nem unidade fora da tupla", () => {
        expect(formatBytes(-1)).toEqual({ value: 0, unit: "b" });
        expect(formatBytes(Number.NaN)).toEqual({ value: 0, unit: "b" });
    });
});