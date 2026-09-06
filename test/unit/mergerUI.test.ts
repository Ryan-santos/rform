import { describe, expect, it } from "vitest";

import mergerUI from "../../src/runtime/utils/mergerUI";

describe("mergerUI", () => {
    it("returns undefined when no valid inputs", () => {
        expect(mergerUI(undefined, undefined)).toBeUndefined();
        expect(mergerUI()).toBeUndefined();
    });

    it("returns the single value when only one input is valid", () => {
        expect(mergerUI("p-4", undefined)).toBe("p-4");
    });

    it("resolves tailwind conflicts when all inputs are strings (twMerge)", () => {
        const result = mergerUI("p-2 text-red-500", "p-4");
        expect(result).toBe("text-red-500 p-4");
    });

    it("merges object-shaped uis recursively", () => {
        const result = mergerUI(
            { root: "p-2", label: "text-red-500" },
            { root: "p-4", label: "text-blue-500" }
        );
        expect(result).toEqual({
            root: "p-4",
            label: "text-blue-500"
        });
    });

    it("sets null source value when source is explicitly null", () => {
        const result = mergerUI({ root: "p-2" }, { root: null });
        expect(result).toEqual({ root: null });
    });

    it("recurses into nested object uis", () => {
        const result = mergerUI(
            { Utils: { Label: { root: "text-red-500" } } },
            { Utils: { Label: { root: "text-blue-500" } } }
        );
        expect(result).toEqual({
            Utils: { Label: { root: "text-blue-500" } }
        });
    });
});