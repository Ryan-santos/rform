import { describe, expect, it } from "vitest";

import resolveMask from "../../src/runtime/utils/resolveMask";

const masks = {
    cpf: { mask: "###.###.###-##" },
    cpfCnpj: { mask: ["###.###.###-##", "##.###.###/####-##"] }
};

describe("resolveMask", () => {
    it("devolve undefined quando nenhuma mask é passada", () => {
        expect(resolveMask(undefined, masks)).toBeUndefined();
        expect(resolveMask(null, masks)).toBeUndefined();
    });

    it("resolve um nome de preset nas opções dele", () => {
        expect(resolveMask("cpf", masks)).toEqual({ mask: "###.###.###-##" });
    });

    it("resolve um preset que guarda máscara dinâmica", () => {
        expect(resolveMask("cpfCnpj", masks)).toEqual({
            mask: ["###.###.###-##", "##.###.###/####-##"]
        });
    });

    it("repassa string desconhecida como pattern maska cru", () => {
        expect(resolveMask("###.###.###-##", masks)).toBe("###.###.###-##");
    });

    it("repassa intacto um objeto de opções", () => {
        const options = { mask: "##/##", eager: true };

        expect(resolveMask(options, masks)).toBe(options);
    });

    it("prefere o preset ao pattern cru quando os dois casariam", () => {
        expect(resolveMask("cpf", { cpf: { mask: "###" } })).toEqual({ mask: "###" });
    });
});