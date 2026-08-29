import { describe, expect, it } from "vitest";
import merger from "../../src/runtime/utils/merger";

describe("merger", () => {
    it("returns first object when only one is passed", () => {
        const a = { foo: 1 };
        const result = merger(a);
        expect(result).toEqual({ foo: 1 });
    });

    it("merges flat keys with later values overriding", () => {
        const result = merger({ a: 1, b: 2 }, { b: 3, c: 4 });
        expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("keeps existing value when later value is null/undefined and existing is truthy", () => {
        const result = merger({ a: 1, b: 2 }, { a: null, b: undefined });
        expect(result.a).toBe(1);
        expect(result.b).toBe(2);
    });

    it("merges nested objects recursively", () => {
        const result = merger(
            { nested: { a: 1, b: 2 } },
            { nested: { b: 99, c: 3 } }
        );
        expect(result.nested).toEqual({ a: 1, b: 99, c: 3 });
    });

    it("does not recurse into arrays — later array replaces earlier", () => {
        const result = merger(
            { items: [1, 2, 3] },
            { items: [9] }
        );
        expect(result.items).toEqual([9]);
    });

    it("delegates ui key to mergerUI for object-shaped ui", () => {
        const result = merger(
            { ui: { root: "p-2 text-red-500" } },
            { ui: { root: "p-4" } }
        );
        expect((result.ui as { root: string }).root).toBe("text-red-500 p-4");
    });

    it("overwrites a string ui key with the later value (no twMerge for top-level strings)", () => {
        const result = merger(
            { ui: "p-2 text-red-500" },
            { ui: "p-4" }
        );
        expect(result.ui).toBe("p-4");
    });

    it("skips null/undefined source objects entirely", () => {
        const result = merger({ a: 1 }, null, undefined, { b: 2 });
        expect(result).toEqual({ a: 1, b: 2 });
    });

    it("returns empty object when no inputs are provided", () => {
        expect(merger()).toEqual({});
    });
});