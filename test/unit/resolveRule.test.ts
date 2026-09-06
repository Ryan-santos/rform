import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import resolveRule from "../../src/runtime/utils/resolveRule";

const rules = {
    required: {
        validation: ({ value }: { value: unknown }) => (value ? undefined : "obrigatório")
    },
    min: {
        validation: ({ value, min }: { value: unknown; min: number }) =>
            String(value).length >= min ? undefined : `mínimo ${min}`
    },
    onlyText: {
        available: ["text"],
        validation: () => undefined
    },
    slow: {
        validation: async ({ value }: { value: unknown }) => {
            await Promise.resolve();
            return value === "ok" ? undefined : "assíncrono falhou";
        }
    }
};

describe("resolveRule", () => {
    it("returns undefined when no rule is given", () => {
        expect(resolveRule(undefined, rules)).toBeUndefined();
        expect(resolveRule(null, rules)).toBeUndefined();
    });

    it("resolves a preset by name, forwarding value and form in one context", async () => {
        const seen: unknown[] = [];
        const spy = {
            spy: {
                validation: (context: unknown) => {
                    seen.push(context);
                    return undefined;
                }
            }
        };

        const form = { nome: "ana" };
        await resolveRule("spy", spy)!("ana", form);

        expect(seen).toEqual([{ value: "ana", form }]);
    });

    it("returns the message of a failing preset", async () => {
        expect(await resolveRule("required", rules)!("", {})).toBe("obrigatório");
        expect(await resolveRule("required", rules)!("ana", {})).toBeUndefined();
    });

    it("forwards named args from the object form", async () => {
        const rule = resolveRule({ name: "min", min: 3 }, rules)!;

        expect(await rule("ab", {})).toBe("mínimo 3");
        expect(await rule("abc", {})).toBeUndefined();
    });

    it("never lets an argument shadow value or form", async () => {
        const seen: unknown[] = [];
        const spy = {
            spy: {
                validation: (context: unknown) => {
                    seen.push(context);
                    return undefined;
                }
            }
        };

        await resolveRule({ name: "spy", value: "roubado", form: "roubado" }, spy)!("real", {
            id: 1
        });

        expect(seen).toEqual([{ value: "real", form: { id: 1 } }]);
    });

    it("awaits an async preset", async () => {
        expect(await resolveRule("slow", rules)!("nope", {})).toBe("assíncrono falhou");
    });

    it("accepts a plain function, called with the same context", async () => {
        const rule = resolveRule(
            ({ value }: { value: unknown }) => (value === 1 ? undefined : "não é 1"),
            rules
        )!;

        expect(await rule(2, {})).toBe("não é 1");
        expect(await rule(1, {})).toBeUndefined();
    });

    it("hands a plain function the form too", async () => {
        const rule = resolveRule(
            ({ value, form }: { value: unknown; form: { pais?: string } }) =>
                form?.pais === "BR" || value === "livre" ? undefined : "só no BR",
            rules
        )!;

        expect(await rule("x", { pais: "PT" })).toBe("só no BR");
        expect(await rule("x", { pais: "BR" })).toBeUndefined();
    });

    it("accepts a zod schema and returns its first issue message", async () => {
        const rule = resolveRule(z.string().min(3, "curto demais"), rules)!;

        expect(await rule("ab", {})).toBe("curto demais");
        expect(await rule("abc", {})).toBeUndefined();
    });

    it("runs an array in order and stops at the first failure", async () => {
        const rule = resolveRule(["required", { name: "min", min: 3 }], rules)!;

        expect(await rule("", {})).toBe("obrigatório");
        expect(await rule("ab", {})).toBe("mínimo 3");
        expect(await rule("abc", {})).toBeUndefined();
    });

    it("does not put a translator in the context", async () => {
        let seen: Record<string, unknown> | undefined;

        const rules = {
            spy: {
                validation: (context: Record<string, unknown>) => {
                    seen = context;
                }
            }
        };

        const resolved = resolveRule("spy", rules as never, "text")!;

        await resolved("ana", {});

        expect(seen).toEqual({ value: "ana", form: {} });
    });

    it("throws naming the unknown preset", () => {
        expect(() => resolveRule("naoExiste", rules)).toThrowError(/naoExiste/);
    });

    it("warns when the preset is not available for the field", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        resolveRule("onlyText", rules, "color");

        expect(warn).toHaveBeenCalledWith(expect.stringContaining("onlyText"));

        warn.mockRestore();
    });

    it("does not warn when the field is listed as available", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        resolveRule("onlyText", rules, "text");

        expect(warn).not.toHaveBeenCalled();

        warn.mockRestore();
    });
});