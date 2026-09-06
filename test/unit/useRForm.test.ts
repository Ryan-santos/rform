import { describe, expect, it } from "vitest";
import { z, ZodObject } from "zod";

import useRForm from "../../src/runtime/composables/useRForm";

describe("useRForm", () => {
    it("devolve um data vazio quando chamado sem argumento", () => {
        const result = useRForm();
        expect(result.data.value).toEqual({});
        expect("rules" in result).toBe(false);
    });

    it("trata um record só-zod como rules planas e devolve um ZodObject", () => {
        const result = useRForm({
            name: z.string().min(1),
            age: z.number()
        });
        expect(result.rules).toBeInstanceOf(ZodObject);
        const parsed = result.rules.safeParse({ name: "x", age: 1 });
        expect(parsed.success).toBe(true);
    });

    it("agrega as rules de um schema de campos planos", () => {
        const result = useRForm({
            name: { type: "text", rule: z.string().min(2) }
        } as never);
        expect(result.rules).toBeInstanceOf(ZodObject);
        const bad = result.rules.safeParse({ name: "" });
        expect(bad.success).toBe(false);
    });

    it("agrega as rules recursivamente nos filhos de um object", () => {
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

    it("agrega as rules de um array de objetos", () => {
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

    it("deixa intacta uma rule de preset, para o campo resolvê-la", () => {
        const result = useRForm({
            doc: { type: "text", rule: "brCpf" }
        } as never) as unknown as { schema: { doc: { rule: unknown } } };

        expect(result.schema.doc.rule).toBe("brCpf");
    });

    it("deixa intacto um array de presets composto", () => {
        const result = useRForm({
            doc: { type: "text", rule: ["required", { name: "min", min: 3 }] }
        } as never) as unknown as { schema: { doc: { rule: unknown } } };

        expect(result.schema.doc.rule).toEqual(["required", { name: "min", min: 3 }]);
    });

    it("cobra uma rule de preset pelo objeto zod agregado", async () => {
        const result = useRForm({
            doc: { type: "text", rule: "brCpf" }
        } as never);

        expect((await result.rules.safeParseAsync({ doc: "111.111.111-11" })).success).toBe(false);
        expect((await result.rules.safeParseAsync({ doc: "529.982.247-25" })).success).toBe(true);
    });

    it("reporta a mensagem do preset no objeto zod agregado", async () => {
        const result = useRForm({
            doc: { type: "text", rule: "brCpf" }
        } as never);

        const parsed = await result.rules.safeParseAsync({ doc: "111.111.111-11" });

        expect(parsed.error?.issues[0]?.message).toBe("CPF inválido.");
    });

    it("normaliza o schema convertendo a rule zod num validador chamável", () => {
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