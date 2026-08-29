// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h, nextTick, ref } from "vue";
import { RDate, RForm } from "#components";

describe("RDate", () => {
    it("emits ISO date when user types a valid date in single mode", async () => {
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

    it("renders an external modelValue formatted as dd/mm/yyyy", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { modelValue: "2026-05-15" } as never
        });

        const input = wrapper.find("input");
        expect((input.element as HTMLInputElement).value).toBe("15/05/2026");
    });

    it("emits empty string (not default) when input is cleared", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { default: "2003-11-24", modelValue: "2026-05-15" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("");
    });

    it("clears partial input on blur", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("01/01/2");
        await input.trigger("blur");
        await nextTick();

        expect((input.element as HTMLInputElement).value).toBe("");
    });

    it("renders two inputs and an 'até' separator in range mode", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { mode: "range", modelValue: [undefined, undefined] } as never
        });

        const inputs = wrapper.findAll("input");
        expect(inputs).toHaveLength(2);
        expect(wrapper.text()).toContain("até");
    });

    it("emits a tuple when both range inputs are filled", async () => {
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

    it("keeps range as a tuple when one side is cleared", async () => {
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

    it("renders a readonly input in multiple mode and joins values with comma", async () => {
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

    it("does not emit on typing while in multiple mode", async () => {
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
        // No emit should change the multiple model from typed input.
        for (const e of emits) {
            expect(e[0]).not.toEqual(["2026-12-31"]);
        }
    });

    it("uses the dd/mm/aaaa hh:mm placeholder when time prop is set", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { time: true, modelValue: "" } as never
        });

        const input = wrapper.find("input");
        expect(input.attributes("placeholder")).toBe("dd/mm/aaaa hh:mm");
    });

    it("emits ISO datetime when a valid datetime is typed (time mode)", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { time: true, modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("01/01/2026 14:30");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("2026-01-01T14:30");
    });

    it("updates the parent RForm model when typed inside <RForm>", async () => {
        const form = ref<Record<string, unknown>>({});

        const Parent = defineComponent({
            setup: () => () =>
                h(
                    RForm,
                    {
                        "modelValue": form.value,
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