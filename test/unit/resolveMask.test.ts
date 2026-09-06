import { describe, expect, it } from "vitest";

import resolveMask from "../../src/runtime/utils/resolveMask";

const masks = {
    cpf: { mask: "###.###.###-##" },
    cpfCnpj: { mask: ["###.###.###-##", "##.###.###/####-##"] }
};

describe("resolveMask", () => {
    it("returns undefined when no mask is given", () => {
        expect(resolveMask(undefined, masks)).toBeUndefined();
        expect(resolveMask(null, masks)).toBeUndefined();
    });

    it("resolves a preset name to its options", () => {
        expect(resolveMask("cpf", masks)).toEqual({ mask: "###.###.###-##" });
    });

    it("resolves a preset holding a dynamic mask", () => {
        expect(resolveMask("cpfCnpj", masks)).toEqual({
            mask: ["###.###.###-##", "##.###.###/####-##"]
        });
    });

    it("passes an unknown string through as a raw maska pattern", () => {
        expect(resolveMask("###.###.###-##", masks)).toBe("###.###.###-##");
    });

    it("passes an options object through untouched", () => {
        const options = { mask: "##/##", eager: true };

        expect(resolveMask(options, masks)).toBe(options);
    });

    it("prefers the preset over a raw pattern when both could match", () => {
        expect(resolveMask("cpf", { cpf: { mask: "###" } })).toEqual({ mask: "###" });
    });
});