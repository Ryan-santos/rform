import { describe, expect, it } from "vitest";
import {
    formatIso,
    formatIsoDate,
    formatIsoDateTime,
    parseIncoming
} from "../../src/runtime/components/Utils/Calendar.vue";

describe("formatIsoDate", () => {
    it("formats a Date as YYYY-MM-DD", () => {
        expect(formatIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
        expect(formatIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
    });
});

describe("formatIsoDateTime", () => {
    it("formats a Date as YYYY-MM-DDTHH:mm", () => {
        expect(formatIsoDateTime(new Date(2026, 4, 27, 9, 5))).toBe("2026-05-27T09:05");
    });

    it("zero-pads single-digit hours and minutes", () => {
        expect(formatIsoDateTime(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01T00:00");
    });
});

describe("formatIso", () => {
    it("returns undefined when the date is null", () => {
        expect(formatIso(null, false)).toBeUndefined();
        expect(formatIso(null, true)).toBeUndefined();
    });

    it("returns undefined when the date is undefined", () => {
        expect(formatIso(undefined, false)).toBeUndefined();
    });

    it("delegates to formatIsoDate when time is false", () => {
        expect(formatIso(new Date(2026, 4, 27, 9, 5), false)).toBe("2026-05-27");
    });

    it("delegates to formatIsoDateTime when time is true", () => {
        expect(formatIso(new Date(2026, 4, 27, 9, 5), true)).toBe("2026-05-27T09:05");
    });
});

describe("parseIncoming", () => {
    it("returns the same Date instance when given a Date", () => {
        const d = new Date(2026, 0, 1);
        expect(parseIncoming(d)).toBe(d);
    });

    it("returns null for non-string non-Date values", () => {
        expect(parseIncoming(null)).toBeNull();
        expect(parseIncoming(undefined)).toBeNull();
        expect(parseIncoming(123 as never)).toBeNull();
        expect(parseIncoming({} as never)).toBeNull();
    });

    it("returns null for an empty string", () => {
        expect(parseIncoming("")).toBeNull();
        expect(parseIncoming("   " as never)).toBeNull();
    });

    it("returns null for unparseable strings", () => {
        expect(parseIncoming("invalid")).toBeNull();
        expect(parseIncoming("2026/05/27")).toBeNull();
    });

    it("parses an ISO date string YYYY-MM-DD", () => {
        const d = parseIncoming("2026-05-27");
        expect(d).toBeInstanceOf(Date);
        expect(d?.getFullYear()).toBe(2026);
        expect(d?.getMonth()).toBe(4);
        expect(d?.getDate()).toBe(27);
        expect(d?.getHours()).toBe(0);
        expect(d?.getMinutes()).toBe(0);
    });

    it("parses an ISO date-time string with T separator", () => {
        const d = parseIncoming("2026-05-27T09:30");
        expect(d?.getHours()).toBe(9);
        expect(d?.getMinutes()).toBe(30);
    });

    it("parses an ISO date-time string with space separator", () => {
        const d = parseIncoming("2026-05-27 14:15");
        expect(d?.getHours()).toBe(14);
        expect(d?.getMinutes()).toBe(15);
    });

    it("parses a locale date string DD/MM/YYYY", () => {
        const d = parseIncoming("27/05/2026");
        expect(d?.getFullYear()).toBe(2026);
        expect(d?.getMonth()).toBe(4);
        expect(d?.getDate()).toBe(27);
    });

    it("parses a locale date-time string DD/MM/YYYY HH:mm", () => {
        const d = parseIncoming("27/05/2026 08:45");
        expect(d?.getHours()).toBe(8);
        expect(d?.getMinutes()).toBe(45);
    });
});