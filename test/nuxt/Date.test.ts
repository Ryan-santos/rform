import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";

import { RDate, RForm } from "#components";

describe("RDate", () => {
    it("emite data ISO quando se digita uma data válida no modo single", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("01/01/2026");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits).toBeTruthy();
        expect(emits?.at(-1)?.[0]).toBe("2026-01-01");
    });

    it("renderiza um modelValue externo formatado como dd/mm/yyyy", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { modelValue: "2026-05-15" } as never
        });

        const input = wrapper.find("input");
        expect((input.element as HTMLInputElement).value).toBe("15/05/2026");
    });

    it("emite string vazia — e não o default — quando o input é limpo", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { default: "2003-11-24", modelValue: "2026-05-15" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("");
    });

    it("limpa entrada parcial no blur", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("01/01/2");
        await input.trigger("blur");
        await nextTick();

        expect((input.element as HTMLInputElement).value).toBe("");
    });

    it("renderiza dois inputs e um separador 'até' no modo range", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { mode: "range", modelValue: [undefined, undefined] } as never
        });

        const inputs = wrapper.findAll("input");
        expect(inputs).toHaveLength(2);
        expect(wrapper.text()).toContain("até");
    });

    it("emite uma tupla quando os dois inputs do range estão preenchidos", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { mode: "range", modelValue: [undefined, undefined] } as never
        });

        const inputs = wrapper.findAll("input");
        await inputs[0]!.setValue("01/01/2026");
        await nextTick();
        await inputs[1]!.setValue("31/12/2026");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        const last = emits?.at(-1)?.[0];
        expect(Array.isArray(last)).toBe(true);
        expect(last).toEqual(["2026-01-01", "2026-12-31"]);
    });

    it("mantém o range como tupla quando um lado é limpo", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { mode: "range", modelValue: ["2026-01-01", "2026-12-31"] } as never
        });

        const inputs = wrapper.findAll("input");
        await inputs[1]!.setValue("");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        const last = emits?.at(-1)?.[0] as [string | undefined, string | undefined];
        expect(Array.isArray(last)).toBe(true);
        expect(last).toHaveLength(2);
        expect(last[0]).toBe("2026-01-01");
        expect(last[1]).toBeUndefined();
    });

    it("renderiza um input somente leitura no modo multiple, juntando os valores por vírgula", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: {
                mode: "multiple",
                modelValue: ["2026-01-01", "2026-02-15"]
            } as never
        });

        const input = wrapper.find("input");
        expect(input.attributes("readonly")).toBeDefined();
        expect((input.element as HTMLInputElement).value).toBe("01/01/2026, 15/02/2026");
    });

    it("não emite ao digitar no modo multiple", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: {
                mode: "multiple",
                modelValue: ["2026-01-01"]
            } as never
        });

        const input = wrapper.find("input");
        await input.setValue("31/12/2026");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue") ?? [];
        // Nenhum emit deve mudar o model do modo multiple por digitação.
        for (const e of emits) {
            expect(e[0]).not.toEqual(["2026-12-31"]);
        }
    });

    it("usa o placeholder dd/mm/aaaa hh:mm quando a prop time está ligada", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { time: true, modelValue: "" } as never
        });

        const input = wrapper.find("input");
        expect(input.attributes("placeholder")).toBe("dd/mm/aaaa hh:mm");
    });

    it("emite data e hora ISO quando se digita uma data-hora válida", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { time: true, modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("01/01/2026 14:30");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("2026-01-01T14:30");
    });

    it("atualiza o model do RForm pai quando digitado dentro de <RForm>", async () => {
        const form = ref<Record<string, unknown>>({});

        const Parent = defineComponent({
            setup: () => () =>
                h(
                    RForm,
                    {
                        modelValue: form.value,
                        "onUpdate:modelValue": (v: Record<string, unknown>) => {
                            form.value = v;
                        }
                    } as never,
                    { default: () => h(RDate, { name: "data" } as never) }
                )
        });

        const wrapper = await mountSuspended(Parent);
        const input = wrapper.find("input");
        await input.setValue("01/01/2026");
        await nextTick();

        expect(form.value.data).toBe("2026-01-01");
    });
});
describe("RDate: navegação entre as partes do range", () => {
    // Todos anexam no mesmo body, então o foco vaza de um teste para o outro.
    const mountRange = (modelValue: unknown = ["", ""]) => {
        (document.activeElement as HTMLElement | null)?.blur();

        return mountSuspended(RDate, {
            attachTo: document.body,
            props: { mode: "range", modelValue } as never
        });
    };

    it("foca a segunda parte quando a primeira fica completa e válida", async () => {
        const wrapper = await mountRange();
        const inputs = wrapper.findAll("input");

        await inputs[0]!.setValue("01/01/2026");
        await nextTick();

        expect(document.activeElement).toBe(inputs[1]!.element);
    });

    it("não rouba o cursor ao reeditar uma primeira parte que já era válida", async () => {
        const wrapper = await mountRange(["2026-01-01", ""]);
        const inputs = wrapper.findAll("input");

        (inputs[0]!.element as HTMLInputElement).focus();
        await inputs[0]!.setValue("02/01/2026");
        await nextTick();

        expect(document.activeElement).toBe(inputs[0]!.element);
    });

    it("volta para a primeira parte com Backspace na segunda vazia", async () => {
        const wrapper = await mountRange(["2026-01-01", ""]);
        const inputs = wrapper.findAll("input");

        (inputs[1]!.element as HTMLInputElement).focus();
        await inputs[1]!.trigger("keydown", { key: "Backspace" });
        await nextTick();

        expect(document.activeElement).toBe(inputs[0]!.element);
    });

    it("clicar no meio foca a parte vazia", async () => {
        const wrapper = await mountRange(["2026-01-01", ""]);
        const inputs = wrapper.findAll("input");

        await wrapper.find('[class*="opacity-50"]').trigger("mousedown");
        await nextTick();

        expect(document.activeElement).toBe(inputs[1]!.element);
    });

    it("clicar no meio com as duas partes preenchidas foca a primeira", async () => {
        const wrapper = await mountRange(["2026-01-01", "2026-12-31"]);
        const inputs = wrapper.findAll("input");

        await wrapper.find('[class*="opacity-50"]').trigger("mousedown");
        await nextTick();

        expect(document.activeElement).toBe(inputs[0]!.element);
    });
});