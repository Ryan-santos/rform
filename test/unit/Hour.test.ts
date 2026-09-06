import { describe, expect, it } from "vitest";

import {
    clampHours,
    clampMinutes,
    formatTime,
    pad,
    parseTime
} from "../../src/runtime/components/fields/Hour.vue";

describe("pad", () => {
    it("completa um dígito só para dois caracteres", () => {
        expect(pad(3)).toBe("03");
    });

    it("deixa intacto um valor de dois dígitos", () => {
        expect(pad(23)).toBe("23");
    });

    it("devolve '00' para zero", () => {
        expect(pad(0)).toBe("00");
    });
});

describe("clampHours", () => {
    it("limita valor negativo a 0", () => {
        expect(clampHours(-5)).toBe(0);
    });

    it("limita valor acima de 23 a 23", () => {
        expect(clampHours(99)).toBe(23);
    });

    it("mantém valor dentro da faixa [0, 23]", () => {
        expect(clampHours(0)).toBe(0);
        expect(clampHours(12)).toBe(12);
        expect(clampHours(23)).toBe(23);
    });
});

describe("clampMinutes", () => {
    it("limita valor negativo a 0", () => {
        expect(clampMinutes(-1)).toBe(0);
    });

    it("limita valor acima de 59 a 59", () => {
        expect(clampMinutes(99)).toBe(59);
    });

    it("mantém valor dentro da faixa [0, 59]", () => {
        expect(clampMinutes(30)).toBe(30);
    });
});

describe("parseTime", () => {
    it("devolve null para entrada nula", () => {
        expect(parseTime(null)).toBeNull();
        expect(parseTime(undefined)).toBeNull();
    });

    it("devolve null para string vazia", () => {
        expect(parseTime("")).toBeNull();
        expect(parseTime("   ")).toBeNull();
    });

    it("devolve null quando a string não casa com HH:MM", () => {
        expect(parseTime("abc")).toBeNull();
        expect(parseTime("12-30")).toBeNull();
        expect(parseTime("12")).toBeNull();
    });

    it("parseia um HH:MM bem-formado em horas e minutos", () => {
        expect(parseTime("09:30")).toEqual({ hours: 9, minutes: 30 });
    });

    it("limita hora e minuto fora da faixa, internamente", () => {
        expect(parseTime("29:99")).toEqual({ hours: 23, minutes: 59 });
    });

    it("tira o espaço em volta antes de parsear", () => {
        expect(parseTime("  12:00  ")).toEqual({ hours: 12, minutes: 0 });
    });
});

describe("formatTime", () => {
    it("sempre formata como HH:MM, completado com zero", () => {
        expect(formatTime(9, 5)).toBe("09:05");
    });

    it("limita hora e minuto antes de formatar", () => {
        expect(formatTime(99, 99)).toBe("23:59");
        expect(formatTime(-1, -1)).toBe("00:00");
    });
});