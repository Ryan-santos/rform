import { describe, expect, it } from "vitest";

import acceptMatch from "../../src/runtime/utils/acceptMatch";

/** O mínimo de um `File` que o matcher lê — nem happy-dom nem node precisam entrar. */
const file = (name: string, type = "") => ({ name, type });

describe("acceptMatch", () => {
    it("sem accept, aceita tudo e não escreve o atributo", () => {
        const empty = acceptMatch(undefined);

        expect(empty.attr).toBeUndefined();
        expect(empty.list).toEqual([]);
        expect(empty.matches(file("qualquer.exe", "application/x-msdownload"))).toBe(true);

        expect(acceptMatch("   ").attr).toBeUndefined();
        expect(acceptMatch(",,").matches(file("x.png"))).toBe(true);
    });

    it("extensão casa com e sem o ponto, e sem caixa", () => {
        const only = acceptMatch("png, .JPG");

        expect(only.matches(file("foto.png"))).toBe(true);
        expect(only.matches(file("FOTO.PNG"))).toBe(true);
        expect(only.matches(file("foto.jpg"))).toBe(true);
        expect(only.matches(file("foto.gif"))).toBe(false);
        expect(only.matches(file("sem-extensao"))).toBe(false);
    });

    it("normaliza o atributo do input nativo, que não aceita `png` cru", () => {
        expect(acceptMatch("png, jpg").attr).toBe(".png,.jpg");
        expect(acceptMatch(" .pdf ").attr).toBe(".pdf");
        expect(acceptMatch("image/*, .pdf").attr).toBe("image/*,.pdf");
    });

    it("MIME exato casa pelo type, não pelo nome", () => {
        const pdf = acceptMatch("application/pdf");

        expect(pdf.matches(file("contrato", "application/pdf"))).toBe(true);
        expect(pdf.matches(file("contrato.pdf", ""))).toBe(false);
        expect(pdf.matches(file("foto.png", "image/png"))).toBe(false);
    });

    it("curinga casa a família inteira — é o `image/*` do próprio JSDoc de hoje", () => {
        const images = acceptMatch("image/*");

        expect(images.matches(file("foto.png", "image/png"))).toBe(true);
        expect(images.matches(file("foto.webp", "image/webp"))).toBe(true);
        expect(images.matches(file("doc.pdf", "application/pdf"))).toBe(false);
    });

    it("`*` sozinho libera tudo, mas continua no atributo", () => {
        const all = acceptMatch("*");

        expect(all.matches(file("x.exe"))).toBe(true);
        expect(all.attr).toBe("*");
    });

    it("a lista é o que as badges mostram, já normalizada e sem repetição", () => {
        expect(acceptMatch("png, .png, image/*").list).toEqual([".png", "image/*"]);
    });
});