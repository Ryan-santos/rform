import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import { RForm } from "#components";

describe("RForm", () => {
    it("renderiza um <form> com a classe de ui default", async () => {
        const Slot = defineComponent({
            setup: () => () => h("span", "ok")
        });

        const wrapper = await mountSuspended(RForm, {
            slots: { default: () => h(Slot) }
        });

        const form = wrapper.find("form");
        expect(form.exists()).toBe(true);
        expect(form.classes().join(" ")).toMatch(/flex-col/);
    });

    it("expõe model, submit e validate no slot default", async () => {
        let received: Record<string, unknown> | null = null;

        await mountSuspended(RForm, {
            slots: {
                default: (scope: Record<string, unknown>) => {
                    received = scope;
                    return h("span");
                }
            }
        });

        expect(received).not.toBeNull();
        expect(received).toHaveProperty("model");
        expect(received).toHaveProperty("submit");
        expect(received).toHaveProperty("validate");
        const scope = received as unknown as { submit: unknown };
        expect(typeof scope.submit).toBe("function");
    });

    it("chama onSubmit com o model corrente ao submeter", async () => {
        const onSubmit = vi.fn();

        const wrapper = await mountSuspended(RForm, {
            props: {
                modelValue: { foo: "bar" } as never,
                onSubmit
            } as never
        });

        await wrapper.find("form").trigger("submit");
        await new Promise((r) => setTimeout(r));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({ foo: "bar" });
    });
});