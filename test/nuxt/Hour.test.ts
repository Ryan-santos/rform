import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { RHour } from "#components";

describe("RHour", () => {
    it("renderiza um <input> só por padrão", async () => {
        const wrapper = await mountSuspended(RHour);
        const inputs = wrapper.findAll("input");
        expect(inputs).toHaveLength(1);
        expect(inputs[0]!.attributes("placeholder")).toBe("hh:mm");
    });

    it("renderiza dois <input> quando range é true", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { range: true } as never
        });
        expect(wrapper.findAll("input")).toHaveLength(2);
    });

    it("reflete um modelValue string no input", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { modelValue: "09:30" } as never
        });
        const input = wrapper.find("input");
        expect((input.element as HTMLInputElement).value).toBe("09:30");
    });

    it("reflete um modelValue tupla nos dois inputs do range", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { range: true, modelValue: ["08:00", "17:30"] } as never
        });
        const inputs = wrapper.findAll("input");
        expect((inputs[0]!.element as HTMLInputElement).value).toBe("08:00");
        expect((inputs[1]!.element as HTMLInputElement).value).toBe("17:30");
    });

    it("emite um model normalizado quando se digita uma hora válida", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { modelValue: "" } as never
        });
        await wrapper.find("input").setValue("12:30");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits).toBeTruthy();
        expect(emits?.at(-1)?.[0]).toBe("12:30");
    });

    it("limita no blur a entrada fora da faixa", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { modelValue: "" } as never
        });
        const input = wrapper.find("input");
        await input.setValue("29:99");
        await input.trigger("blur");
        await nextTick();

        expect((input.element as HTMLInputElement).value).toBe("23:59");
        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("23:59");
    });

    it("emite string vazia — e não o default — quando o input é limpo", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { default: "09:00", modelValue: "12:00" } as never
        });
        await wrapper.find("input").setValue("");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("");
    });

    it("aplica o atributo name no input", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { name: "start", modelValue: "" } as never
        });
        expect(wrapper.find("input").attributes("name")).toBe("start");
    });

    it("emite uma tupla quando se digita num campo range", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { range: true, modelValue: ["", ""] } as never
        });
        const inputs = wrapper.findAll("input");
        await inputs[0]!.setValue("08:00");
        await nextTick();
        await inputs[1]!.setValue("17:30");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        const last = emits?.at(-1)?.[0];
        expect(Array.isArray(last)).toBe(true);
        expect(last).toEqual(["08:00", "17:30"]);
    });
});
describe("RHour: navegação entre as partes do range", () => {
    // Todos anexam no mesmo body, então o foco vaza de um teste para o outro.
    const mountRange = (modelValue: unknown = ["", ""]) => {
        (document.activeElement as HTMLElement | null)?.blur();

        return mountSuspended(RHour, {
            attachTo: document.body,
            props: { range: true, modelValue } as never
        });
    };

    it("foca a segunda parte quando a primeira fica completa e válida", async () => {
        const wrapper = await mountRange();
        const inputs = wrapper.findAll("input");

        await inputs[0]!.setValue("08:00");
        await nextTick();

        expect(document.activeElement).toBe(inputs[1]!.element);
    });

    it("não rouba o cursor ao reeditar uma primeira parte que já era válida", async () => {
        const wrapper = await mountRange(["08:00", ""]);
        const inputs = wrapper.findAll("input");

        (inputs[0]!.element as HTMLInputElement).focus();
        await inputs[0]!.setValue("09:00");
        await nextTick();

        expect(document.activeElement).toBe(inputs[0]!.element);
    });

    it("volta para a primeira parte com Backspace na segunda vazia", async () => {
        const wrapper = await mountRange(["08:00", ""]);
        const inputs = wrapper.findAll("input");

        (inputs[1]!.element as HTMLInputElement).focus();
        await inputs[1]!.trigger("keydown", { key: "Backspace" });
        await nextTick();

        expect(document.activeElement).toBe(inputs[0]!.element);
    });

    it("clicar no meio foca a parte vazia", async () => {
        const wrapper = await mountRange(["08:00", ""]);
        const inputs = wrapper.findAll("input");

        await wrapper.find('[class*="opacity-50"]').trigger("mousedown");
        await nextTick();

        expect(document.activeElement).toBe(inputs[1]!.element);
    });

    it("clicar no meio com as duas partes preenchidas foca a primeira", async () => {
        const wrapper = await mountRange(["08:00", "17:30"]);
        const inputs = wrapper.findAll("input");

        await wrapper.find('[class*="opacity-50"]').trigger("mousedown");
        await nextTick();

        expect(document.activeElement).toBe(inputs[0]!.element);
    });
});