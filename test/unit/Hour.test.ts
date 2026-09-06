import { describe, expect, it } from "vitest";

import {
    clampHours,
    clampMinutes,
    formatTime,
    pad,
    parseTime
} from "../../src/runtime/components/fields/Hour.vue";

describe("pad", () => {
    it("zero-pads a single digit to two chars", () => {
        expect(pad(3)).toBe("03");
    });

    it("leaves a two-digit value untouched", () => {
        expect(pad(23)).toBe("23");
    });

    it("returns '00' for zero", () => {
        expect(pad(0)).toBe("00");
    });
});

describe("clampHours", () => {
    it("clamps negative values to 0", () => {
        expect(clampHours(-5)).toBe(0);
    });

    it("clamps values above 23 to 23", () => {
        expect(clampHours(99)).toBe(23);
    });

    it("keeps values inside the [0, 23] range", () => {
        expect(clampHours(0)).toBe(0);
        expect(clampHours(12)).toBe(12);
        expect(clampHours(23)).toBe(23);
    });
});

describe("clampMinutes", () => {
    it("clamps negative values to 0", () => {
        expect(clampMinutes(-1)).toBe(0);
    });

    it("clamps values above 59 to 59", () => {
        expect(clampMinutes(99)).toBe(59);
    });

    it("keeps values inside the [0, 59] range", () => {
        expect(clampMinutes(30)).toBe(30);
    });
});

describe("parseTime", () => {
    it("returns null for nullish input", () => {
        expect(parseTime(null)).toBeNull();
        expect(parseTime(undefined)).toBeNull();
    });

    it("returns null for an empty string", () => {
        expect(parseTime("")).toBeNull();
        expect(parseTime("   ")).toBeNull();
    });

    it("returns null when the string does not match HH:MM", () => {
        expect(parseTime("abc")).toBeNull();
        expect(parseTime("12-30")).toBeNull();
        expect(parseTime("12")).toBeNull();
    });

    it("parses well-formed HH:MM into hours/minutes", () => {
        expect(parseTime("09:30")).toEqual({ hours: 9, minutes: 30 });
    });

    it("clamps out-of-range hours and minutes internally", () => {
        expect(parseTime("29:99")).toEqual({ hours: 23, minutes: 59 });
    });

    it("trims surrounding whitespace before parsing", () => {
        expect(parseTime("  12:00  ")).toEqual({ hours: 12, minutes: 0 });
    });
});

describe("formatTime", () => {
    it("always formats to HH:MM zero-padded", () => {
        expect(formatTime(9, 5)).toBe("09:05");
    });

    it("clamps the hours and minutes before formatting", () => {
        expect(formatTime(99, 99)).toBe("23:59");
        expect(formatTime(-1, -1)).toBe("00:00");
    });
});