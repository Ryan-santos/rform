import { describe, expect, it } from "vitest";

import dateFormat from "../../src/runtime/utils/dateFormat";

describe("dateFormat", () => {
    it("lê a ordem dos tokens e o separador do pattern", () => {
        expect(dateFormat("DD/MM/YYYY").order).toEqual(["D", "M", "Y"]);
        expect(dateFormat("MM/DD/YYYY").order).toEqual(["M", "D", "Y"]);
        expect(dateFormat("YYYY-MM-DD").separator).toBe("-");
    });

    it("cai em DD/MM/YYYY para um pattern que não é data", () => {
        expect(dateFormat("").pattern).toBe("DD/MM/YYYY");
        expect(dateFormat("DD/MM").pattern).toBe("DD/MM/YYYY");
        expect(dateFormat(undefined).pattern).toBe("DD/MM/YYYY");
    });
});

describe("mask", () => {
    it("deriva o pattern maska da ordem e do separador", () => {
        expect(dateFormat("DD/MM/YYYY").mask()).toBe("##/##/####");
        expect(dateFormat("YYYY-MM-DD").mask()).toBe("####-##-##");
    });

    it("acrescenta o relógio quando se pede hora", () => {
        expect(dateFormat("MM/DD/YYYY").mask(true)).toBe("##/##/#### ##:##");
    });
});

describe("format", () => {
    it("escreve as partes na ordem do pattern", () => {
        const date = new Date(2026, 4, 15, 14, 30);

        expect(dateFormat("DD/MM/YYYY").format(date)).toBe("15/05/2026");
        expect(dateFormat("MM/DD/YYYY").format(date)).toBe("05/15/2026");
        expect(dateFormat("YYYY-MM-DD").format(date)).toBe("2026-05-15");
    });

    it("acrescenta o relógio quando se pede hora", () => {
        const date = new Date(2026, 4, 15, 14, 30);

        expect(dateFormat("DD/MM/YYYY").format(date, true)).toBe("15/05/2026 14:30");
    });

    it("renderiza data ausente como string vazia", () => {
        expect(dateFormat("DD/MM/YYYY").format(null)).toBe("");
        expect(dateFormat("DD/MM/YYYY").format(undefined)).toBe("");
    });
});

describe("parse", () => {
    it("lê as partes na ordem do pattern", () => {
        const br = dateFormat("DD/MM/YYYY").parse("15/05/2026")!;
        const us = dateFormat("MM/DD/YYYY").parse("05/15/2026")!;

        expect([br.getFullYear(), br.getMonth(), br.getDate()]).toEqual([2026, 4, 15]);
        expect([us.getFullYear(), us.getMonth(), us.getDate()]).toEqual([2026, 4, 15]);
    });

    it("lê os mesmos dígitos de outro jeito sob outro pattern", () => {
        const value = "05/06/2026";

        expect(dateFormat("DD/MM/YYYY").parse(value)!.getMonth()).toBe(5);
        expect(dateFormat("MM/DD/YYYY").parse(value)!.getMonth()).toBe(4);
    });

    it("recusa um dia que o mês não tem", () => {
        expect(dateFormat("DD/MM/YYYY").parse("31/02/2026")).toBeNull();
        expect(dateFormat("MM/DD/YYYY").parse("02/31/2026")).toBeNull();
    });

    it("aceita 29 de fevereiro em ano bissexto e recusa nos outros", () => {
        expect(dateFormat("DD/MM/YYYY").parse("29/02/2024")).not.toBeNull();
        expect(dateFormat("DD/MM/YYYY").parse("29/02/2026")).toBeNull();
    });

    it("recusa valor parcial ou vazio", () => {
        expect(dateFormat("DD/MM/YYYY").parse("15/05/20")).toBeNull();
        expect(dateFormat("DD/MM/YYYY").parse("")).toBeNull();
        expect(dateFormat("DD/MM/YYYY").parse(undefined)).toBeNull();
    });

    it("exige o relógio quando time é true e o recusa quando false", () => {
        const pattern = dateFormat("DD/MM/YYYY");

        expect(pattern.parse("15/05/2026", true)).toBeNull();
        expect(pattern.parse("15/05/2026 14:30", true)).not.toBeNull();
        expect(pattern.parse("15/05/2026 14:30", false)).toBeNull();
    });

    it('aceita o relógio ou passa sem ele quando time é "optional"', () => {
        const pattern = dateFormat("DD/MM/YYYY");

        expect(pattern.parse("15/05/2026", "optional")).not.toBeNull();
        expect(pattern.parse("15/05/2026 14:30", "optional")!.getHours()).toBe(14);
    });

    it("escapa um separador que é metacaractere de regex", () => {
        expect(dateFormat("DD.MM.YYYY").parse("15.05.2026")).not.toBeNull();
        expect(dateFormat("DD.MM.YYYY").parse("15x05x2026")).toBeNull();
    });
});

describe("roundtrip", () => {
    it("parseia de volta o que formatou, em qualquer ordem", () => {
        const date = new Date(2026, 11, 31, 23, 59);

        for (const source of ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]) {
            const pattern = dateFormat(source);
            const back = pattern.parse(pattern.format(date, true), true)!;

            expect(back.getTime()).toBe(date.getTime());
        }
    });
});