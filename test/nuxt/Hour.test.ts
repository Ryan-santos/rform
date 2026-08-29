// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { nextTick } from "vue";
import { RHour } from "#components";

describe("RHour", () => {
    it("renders a single <input> by default", async () => {
        const wrapper = await mountSuspended(RHour);
        const inputs = wrapper.findAll("input");
        expect(inputs).toHaveLength(1);
        expect(inputs[0]!.attributes("placeholder")).toBe("hh:mm");
    });

    it("renders two <input>s when range is true", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { range: true } as never
        });
        expect(wrapper.findAll("input")).toHaveLength(2);
    });

    it("reflects a string modelValue into the input", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { modelValue: "09:30" } as never
        });
        const input = wrapper.find("input");
        expect((input.element as HTMLInputElement).value).toBe("09:30");
    });

    it("reflects a tuple modelValue into both inputs when range", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { range: true, modelValue: ["08:00", "17:30"] } as never
        });
        const inputs = wrapper.findAll("input");
        expect((inputs[0]!.element as HTMLInputElement).value).toBe("08:00");
        expect((inputs[1]!.element as HTMLInputElement).value).toBe("17:30");
    });

    it("emits a normalized model value when the user types a valid time", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { modelValue: "" } as never
        });
        await wrapper.find("input").setValue("12:30");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits).toBeTruthy();
        expect(emits?.at(-1)?.[0]).toBe("12:30");
    });

    it("clamps out-of-range input on blur", async () => {
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

    it("emits an empty string (not the default) when the input is cleared", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { default: "09:00", modelValue: "12:00" } as never
        });
        await wrapper.find("input").setValue("");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("");
    });

    it("applies the name attribute on the input", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { name: "start", modelValue: "" } as never
        });
        expect(wrapper.find("input").attributes("name")).toBe("start");
    });

    it("emits a tuple when the user types into a range field", async () => {
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