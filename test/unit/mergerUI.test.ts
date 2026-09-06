import { describe, expect, it } from "vitest";

import mergerUI from "../../src/runtime/utils/mergerUI";

describe("mergerUI", () => {
    it("devolve undefined quando não há entrada válida", () => {
        expect(mergerUI(undefined, undefined)).toBeUndefined();
        expect(mergerUI()).toBeUndefined();
    });

    it("devolve o único valor quando só uma entrada é válida", () => {
        expect(mergerUI("p-4", undefined)).toBe("p-4");
    });

    it("resolve conflito de tailwind quando todas as entradas são string", () => {
        const result = mergerUI("p-2 text-red-500", "p-4");
        expect(result).toBe("text-red-500 p-4");
    });

    it("mescla recursivamente ui em forma de objeto", () => {
        const result = mergerUI(
            { root: "p-2", label: "text-red-500" },
            { root: "p-4", label: "text-blue-500" }
        );
        expect(result).toEqual({
            root: "p-4",
            label: "text-blue-500"
        });
    });

    it("grava null quando a origem é explicitamente null", () => {
        const result = mergerUI({ root: "p-2" }, { root: null });
        expect(result).toEqual({ root: null });
    });

    it("desce em ui de objeto aninhado", () => {
        const result = mergerUI(
            { Utils: { Label: { root: "text-red-500" } } },
            { Utils: { Label: { root: "text-blue-500" } } }
        );
        expect(result).toEqual({
            Utils: { Label: { root: "text-blue-500" } }
        });
    });
});