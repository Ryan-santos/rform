import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import { RForm, RText } from "#components";

/**
 * A field only registers its validator when a Form provides the rules list, so
 * every case here goes through the real chain: useInjection → resolveRule →
 * preset validation.
 */
const mountField = async (rule: unknown, model: Record<string, unknown>) => {
    let scope: { validate: () => Promise<void> } | undefined;

    const wrapper = await mountSuspended(RForm, {
        props: { modelValue: model } as never,
        slots: {
            default: (received: Record<string, unknown>) => {
                scope = received as unknown as { validate: () => Promise<void> };
                return h(RText, { name: "campo", rule } as never);
            }
        }
    });

    return {
        wrapper,
        validate: async () => {
            try {
                await scope!.validate();
            } catch {
                // `validate` rejects on the first failing field; the message is
                // what this asserts on, and it lands on the field itself.
            }

            await nextTick();

            return wrapper.text();
        }
    };
};

describe("rule presets in a live field", () => {
    it("passes named args through to the validation", async () => {
        const short = await mountField({ name: "min", min: 3 }, { campo: "ab" });
        expect(await short.validate()).toContain("Mínimo de 3 caracteres.");

        const ok = await mountField({ name: "min", min: 3 }, { campo: "abc" });
        expect(await ok.validate()).not.toContain("Mínimo");
    });

    it("uses the arg value in the message, not a fixed one", async () => {
        const field = await mountField({ name: "min", min: 8 }, { campo: "ab" });

        expect(await field.validate()).toContain("Mínimo de 8 caracteres.");
    });

    it("resolves a brazilian preset under its br prefix", async () => {
        const bad = await mountField("brCpf", { campo: "111.111.111-11" });
        expect(await bad.validate()).toContain("CPF inválido.");

        const good = await mountField("brCpf", { campo: "529.982.247-25" });
        expect(await good.validate()).not.toContain("CPF inválido.");
    });

    it("hands an inline function the same context object", async () => {
        const field = await mountField(
            ({ value, form }: { value: unknown; form: Record<string, unknown> }) =>
                value === form.esperado ? undefined : "não bate com o form",
            { campo: "a", esperado: "b" }
        );

        expect(await field.validate()).toContain("não bate com o form");
    });

    it("runs an array of refs in order", async () => {
        const empty = await mountField(["required", { name: "min", min: 3 }], { campo: "" });
        expect(await empty.validate()).toContain("Campo obrigatório.");

        const short = await mountField(["required", { name: "min", min: 3 }], { campo: "ab" });
        expect(await short.validate()).toContain("Mínimo de 3 caracteres.");
    });
});