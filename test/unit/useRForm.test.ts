import { describe, expect, it } from "vitest";
import { z, ZodObject } from "zod";

import useRForm from "../../src/runtime/composables/useRForm";

describe("useRForm", () => {
    it("returns empty data ref when called with no args", () => {
        const result = useRForm();
        expect(result.data.value).toEqual({});
        expect("rules" in result).toBe(false);
    });

    it("treats a zod-only record as flat rules and returns a ZodObject", () => {
        const result = useRForm({
            name: z.string().min(1),
            age: z.number()
        });
        expect(result.rules).toBeInstanceOf(ZodObject);
        const parsed = result.rules.safeParse({ name: "x", age: 1 });
        expect(parsed.success).toBe(true);
    });

    it("aggregates rules from a schema with flat fields", () => {
        const result = useRForm({
            name: { type: "text", rule: z.string().min(2) }
        } as never);
        expect(result.rules).toBeInstanceOf(ZodObject);
        const bad = result.rules.safeParse({ name: "" });
        expect(bad.success).toBe(false);
    });

    it("aggregates rules recursively for object children", () => {
        const result = useRForm({
            user: {
                type: "object",
                children: {
                    name: { type: "text", rule: z.string().min(1) },
                    age: { type: "number", rule: z.number().int() }
                }
            }
        } as never);
        const ok = result.rules.safeParse({ user: { name: "a", age: 5 } });
        expect(ok.success).toBe(true);
        const bad = result.rules.safeParse({ user: { name: "", age: 1.5 } });
        expect(bad.success).toBe(false);
    });

    it("aggregates rules for array of objects", () => {
        const result = useRForm({
            tags: {
                type: "array",
                children: {
                    type: "object",
                    children: {
                        label: { type: "text", rule: z.string().min(1) }
                    }
                }
            }
        } as never);
        const ok = result.rules.safeParse({ tags: [{ label: "a" }] });
        expect(ok.success).toBe(true);
        const bad = result.rules.safeParse({ tags: [{ label: "" }] });
        expect(bad.success).toBe(false);
    });

    it("leaves a preset rule untouched so the field resolves it", () => {
        const result = useRForm({
            doc: { type: "text", rule: "brCpf" }
        } as never) as unknown as { schema: { doc: { rule: unknown } } };

        expect(result.schema.doc.rule).toBe("brCpf");
    });

    it("leaves a composed preset array untouched", () => {
        const result = useRForm({
            doc: { type: "text", rule: ["required", { name: "min", min: 3 }] }
        } as never) as unknown as { schema: { doc: { rule: unknown } } };

        expect(result.schema.doc.rule).toEqual(["required", { name: "min", min: 3 }]);
    });

    it("enforces a preset rule through the aggregated zod object", async () => {
        const result = useRForm({
            doc: { type: "text", rule: "brCpf" }
        } as never);

        expect((await result.rules.safeParseAsync({ doc: "111.111.111-11" })).success).toBe(false);
        expect((await result.rules.safeParseAsync({ doc: "529.982.247-25" })).success).toBe(true);
    });

    it("reports the preset message on the aggregated zod object", async () => {
        const result = useRForm({
            doc: { type: "text", rule: "brCpf" }
        } as never);

        const parsed = await result.rules.safeParseAsync({ doc: "111.111.111-11" });

        expect(parsed.error?.issues[0]?.message).toBe("CPF inválido.");
    });

    it("normalizes schema by converting zod rule into a callable validator", () => {
        const result = useRForm({
            name: { type: "text", rule: z.string().min(2) }
        } as never) as unknown as {
            schema: { name: { rule: (value: unknown) => string | undefined } };
        };
        const fn = result.schema.name.rule;
        expect(typeof fn).toBe("function");
        expect(typeof fn("a")).toBe("string");
        expect((fn("a") as string).length).toBeGreaterThan(0);
        expect(fn("ab")).toBeUndefined();
    });
});