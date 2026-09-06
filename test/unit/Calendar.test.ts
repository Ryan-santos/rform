import { describe, expect, it } from "vitest";

import {
    formatIso,
    formatIsoDate,
    formatIsoDateTime,
    parseIncoming
} from "../../src/runtime/components/utils/Calendar.vue";

describe("formatIsoDate", () => {
    it("formata um Date como YYYY-MM-DD", () => {
        expect(formatIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
        expect(formatIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
    });
});

describe("formatIsoDateTime", () => {
    it("formata um Date como YYYY-MM-DDTHH:mm", () => {
        expect(formatIsoDateTime(new Date(2026, 4, 27, 9, 5))).toBe("2026-05-27T09:05");
    });

    it("completa com zero hora e minuto de um dígito", () => {
        expect(formatIsoDateTime(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01T00:00");
    });
});

describe("formatIso", () => {
    it("devolve undefined quando a data é nula", () => {
        expect(formatIso(null, false)).toBeUndefined();
        expect(formatIso(null, true)).toBeUndefined();
    });

    it("devolve undefined quando a data é undefined", () => {
        expect(formatIso(undefined, false)).toBeUndefined();
    });

    it("delega ao formatIsoDate quando time é false", () => {
        expect(formatIso(new Date(2026, 4, 27, 9, 5), false)).toBe("2026-05-27");
    });

    it("delega ao formatIsoDateTime quando time é true", () => {
        expect(formatIso(new Date(2026, 4, 27, 9, 5), true)).toBe("2026-05-27T09:05");
    });
});

describe("parseIncoming", () => {
    it("devolve a mesma instância de Date quando recebe um Date", () => {
        const d = new Date(2026, 0, 1);
        expect(parseIncoming(d)).toBe(d);
    });

    it("devolve null para valor que não é string nem Date", () => {
        expect(parseIncoming(null)).toBeNull();
        expect(parseIncoming(undefined)).toBeNull();
        expect(parseIncoming(123 as never)).toBeNull();
        expect(parseIncoming({} as never)).toBeNull();
    });

    it("devolve null para string vazia", () => {
        expect(parseIncoming("")).toBeNull();
        expect(parseIncoming("   " as never)).toBeNull();
    });

    it("devolve null para string que não parseia", () => {
        expect(parseIncoming("invalid")).toBeNull();
        expect(parseIncoming("2026/05/27")).toBeNull();
    });

    it("parseia uma data ISO YYYY-MM-DD", () => {
        const d = parseIncoming("2026-05-27");
        expect(d).toBeInstanceOf(Date);
        expect(d?.getFullYear()).toBe(2026);
        expect(d?.getMonth()).toBe(4);
        expect(d?.getDate()).toBe(27);
        expect(d?.getHours()).toBe(0);
        expect(d?.getMinutes()).toBe(0);
    });

    it("parseia uma data-hora ISO com separador T", () => {
        const d = parseIncoming("2026-05-27T09:30");
        expect(d?.getHours()).toBe(9);
        expect(d?.getMinutes()).toBe(30);
    });

    it("parseia uma data-hora ISO com separador espaço", () => {
        const d = parseIncoming("2026-05-27 14:15");
        expect(d?.getHours()).toBe(14);
        expect(d?.getMinutes()).toBe(15);
    });

    it("parseia uma data do locale, DD/MM/YYYY", () => {
        const d = parseIncoming("27/05/2026");
        expect(d?.getFullYear()).toBe(2026);
        expect(d?.getMonth()).toBe(4);
        expect(d?.getDate()).toBe(27);
    });

    it("parseia uma data-hora do locale, DD/MM/YYYY HH:mm", () => {
        const d = parseIncoming("27/05/2026 08:45");
        expect(d?.getHours()).toBe(8);
        expect(d?.getMinutes()).toBe(45);
    });
});