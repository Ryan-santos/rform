import { describe, expect, it } from "vitest";

import dateFormat from "../../src/runtime/utils/dateFormat";

describe("dateFormat", () => {
    it("reads the token order and the separator off the pattern", () => {
        expect(dateFormat("DD/MM/YYYY").order).toEqual(["D", "M", "Y"]);
        expect(dateFormat("MM/DD/YYYY").order).toEqual(["M", "D", "Y"]);
        expect(dateFormat("YYYY-MM-DD").separator).toBe("-");
    });

    it("falls back to DD/MM/YYYY for a pattern that is not a date", () => {
        expect(dateFormat("").pattern).toBe("DD/MM/YYYY");
        expect(dateFormat("DD/MM").pattern).toBe("DD/MM/YYYY");
        expect(dateFormat(undefined).pattern).toBe("DD/MM/YYYY");
    });
});

describe("mask", () => {
    it("derives the maska pattern from the order and separator", () => {
        expect(dateFormat("DD/MM/YYYY").mask()).toBe("##/##/####");
        expect(dateFormat("YYYY-MM-DD").mask()).toBe("####-##-##");
    });

    it("appends the clock when time is asked for", () => {
        expect(dateFormat("MM/DD/YYYY").mask(true)).toBe("##/##/#### ##:##");
    });
});

describe("format", () => {
    it("writes the parts in the pattern's order", () => {
        const date = new Date(2026, 4, 15, 14, 30);

        expect(dateFormat("DD/MM/YYYY").format(date)).toBe("15/05/2026");
        expect(dateFormat("MM/DD/YYYY").format(date)).toBe("05/15/2026");
        expect(dateFormat("YYYY-MM-DD").format(date)).toBe("2026-05-15");
    });

    it("appends the clock when time is asked for", () => {
        const date = new Date(2026, 4, 15, 14, 30);

        expect(dateFormat("DD/MM/YYYY").format(date, true)).toBe("15/05/2026 14:30");
    });

    it("renders an absent date as an empty string", () => {
        expect(dateFormat("DD/MM/YYYY").format(null)).toBe("");
        expect(dateFormat("DD/MM/YYYY").format(undefined)).toBe("");
    });
});

describe("parse", () => {
    it("reads the parts in the pattern's order", () => {
        const br = dateFormat("DD/MM/YYYY").parse("15/05/2026")!;
        const us = dateFormat("MM/DD/YYYY").parse("05/15/2026")!;

        expect([br.getFullYear(), br.getMonth(), br.getDate()]).toEqual([2026, 4, 15]);
        expect([us.getFullYear(), us.getMonth(), us.getDate()]).toEqual([2026, 4, 15]);
    });

    it("reads the same digits differently under a different pattern", () => {
        const value = "05/06/2026";

        expect(dateFormat("DD/MM/YYYY").parse(value)!.getMonth()).toBe(5);
        expect(dateFormat("MM/DD/YYYY").parse(value)!.getMonth()).toBe(4);
    });

    it("rejects a day the month does not have", () => {
        expect(dateFormat("DD/MM/YYYY").parse("31/02/2026")).toBeNull();
        expect(dateFormat("MM/DD/YYYY").parse("02/31/2026")).toBeNull();
    });

    it("accepts February 29 on a leap year and rejects it otherwise", () => {
        expect(dateFormat("DD/MM/YYYY").parse("29/02/2024")).not.toBeNull();
        expect(dateFormat("DD/MM/YYYY").parse("29/02/2026")).toBeNull();
    });

    it("rejects a partial or empty value", () => {
        expect(dateFormat("DD/MM/YYYY").parse("15/05/20")).toBeNull();
        expect(dateFormat("DD/MM/YYYY").parse("")).toBeNull();
        expect(dateFormat("DD/MM/YYYY").parse(undefined)).toBeNull();
    });

    it("requires the clock when time is true and refuses it when false", () => {
        const pattern = dateFormat("DD/MM/YYYY");

        expect(pattern.parse("15/05/2026", true)).toBeNull();
        expect(pattern.parse("15/05/2026 14:30", true)).not.toBeNull();
        expect(pattern.parse("15/05/2026 14:30", false)).toBeNull();
    });

    it('takes the clock or leaves it when time is "optional"', () => {
        const pattern = dateFormat("DD/MM/YYYY");

        expect(pattern.parse("15/05/2026", "optional")).not.toBeNull();
        expect(pattern.parse("15/05/2026 14:30", "optional")!.getHours()).toBe(14);
    });

    it("escapes a separator that is a regex metacharacter", () => {
        expect(dateFormat("DD.MM.YYYY").parse("15.05.2026")).not.toBeNull();
        expect(dateFormat("DD.MM.YYYY").parse("15x05x2026")).toBeNull();
    });
});

describe("roundtrip", () => {
    it("parses back whatever it formatted, in either order", () => {
        const date = new Date(2026, 11, 31, 23, 59);

        for (const source of ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]) {
            const pattern = dateFormat(source);
            const back = pattern.parse(pattern.format(date, true), true)!;

            expect(back.getTime()).toBe(date.getTime());
        }
    });
});