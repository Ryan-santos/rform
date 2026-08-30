// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import { RDate, RHour, RText, RTextarea } from "#components";
import vMask from "../../src/runtime/utils/vMask";

const typeInto = (el: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return el.value;
};

describe("mask on RText", () => {
    it("formats through a preset name", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { mask: "brCpf", modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("52998224725");

        expect((input.element as HTMLInputElement).value).toBe("529.982.247-25");
    });

    it("formats through a raw maska pattern", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { mask: "(##) #####-####", modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("11987654321");

        expect((input.element as HTMLInputElement).value).toBe("(11) 98765-4321");
    });

    it("leaves the value alone when no mask is given", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("52998224725");

        expect((input.element as HTMLInputElement).value).toBe("52998224725");
    });
});

describe("mask on RTextarea", () => {
    it("formats through a preset name", async () => {
        const wrapper = await mountSuspended(RTextarea, {
            props: { mask: "brCpf", modelValue: "" } as never
        });

        const textarea = wrapper.find("textarea");
        await textarea.setValue("52998224725");

        expect((textarea.element as HTMLTextAreaElement).value).toBe("529.982.247-25");
    });

    it("formats through a raw maska pattern", async () => {
        const wrapper = await mountSuspended(RTextarea, {
            props: { mask: "(##) #####-####", modelValue: "" } as never
        });

        const textarea = wrapper.find("textarea");
        await textarea.setValue("11987654321");

        expect((textarea.element as HTMLTextAreaElement).value).toBe("(11) 98765-4321");
    });

    it("leaves the value alone when no mask is given", async () => {
        const wrapper = await mountSuspended(RTextarea, {
            props: { modelValue: "" } as never
        });

        const textarea = wrapper.find("textarea");
        await textarea.setValue("linha um\nlinha dois");

        expect((textarea.element as HTMLTextAreaElement).value).toBe("linha um\nlinha dois");
    });

    it("emits the masked value through update:modelValue", async () => {
        const wrapper = await mountSuspended(RTextarea, {
            props: { mask: "brCpf", modelValue: "" } as never
        });

        await wrapper.find("textarea").setValue("52998224725");

        expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBe("529.982.247-25");
    });
});

describe("vMask binds only the element it sits on", () => {
    it("does not reach into a child field from a wrapper", () => {
        const Wrapper = defineComponent({
            directives: { mask: vMask },
            template: `<div v-mask="'##-##'"><input></div>`
        });

        const wrapper = mount(Wrapper);
        const input = wrapper.find("input").element as HTMLInputElement;

        expect(typeInto(input, "5678")).toBe("5678");
    });

    it("warns instead of failing silently when placed on a non-field element", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        const Wrapper = defineComponent({
            directives: { mask: vMask },
            template: `<div v-mask="'##-##'"><input></div>`
        });

        mount(Wrapper);

        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining("v-mask"),
            expect.anything()
        );

        warn.mockRestore();
    });

    it("stops masking the field once the directive unmounts", () => {
        const Host = defineComponent({
            directives: { mask: vMask },
            template: `<input v-mask="'##-##'">`
        });

        const wrapper = mount(Host, { attachTo: document.body });
        const input = wrapper.find("input").element as HTMLInputElement;

        expect(typeInto(input, "5678")).toBe("56-78");

        wrapper.unmount();

        expect(typeInto(input, "1234")).toBe("1234");
    });

    it("leaves no live listener on a child when a wrapper unmounts", () => {
        const show = ref(true);

        const Wrapper = defineComponent({
            directives: { mask: vMask },
            setup: () => ({ show }),
            template: `<div v-mask="'##-##'"><input v-if="show"></div>`
        });

        const wrapper = mount(Wrapper, { attachTo: document.body });
        const input = wrapper.find("input").element as HTMLInputElement;

        wrapper.unmount();

        expect(typeInto(input, "5678")).toBe("5678");
    });
});

describe("mask changing at runtime", () => {
    it("reformats the value already in the field", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { mask: "brCpf", modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("52998224725");
        expect((input.element as HTMLInputElement).value).toBe("529.982.247-25");

        await wrapper.setProps({ mask: "brCnpj" } as never);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect((input.element as HTMLInputElement).value).toBe("52.998.224/725");
    });

    it("stops masking when the mask is removed", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { mask: "brCpf", modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await wrapper.setProps({ mask: undefined } as never);

        await input.setValue("52998224725");

        expect((input.element as HTMLInputElement).value).toBe("52998224725");
    });
});

describe("mask on the date and time components", () => {
    it("masks the hour field", async () => {
        const wrapper = await mountSuspended(RHour, { props: {} as never });

        const input = wrapper.find("input");
        await input.setValue("1230");

        expect((input.element as HTMLInputElement).value).toBe("12:30");
    });

    it("masks the date field", async () => {
        const wrapper = await mountSuspended(RDate, { props: {} as never });

        const input = wrapper.findAll("input").at(-1)!;
        await input.setValue("01012026");

        expect((input.element as HTMLInputElement).value).toBe("01/01/2026");
    });

    it("widens the date mask when time is enabled", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { name: "quando", time: true } as never
        });

        const input = wrapper.find('input[name="quando"]');
        await input.setValue("010120261430");

        expect((input.element as HTMLInputElement).value).toBe("01/01/2026 14:30");
    });

    it("stops masking the hour field once the component unmounts", async () => {
        const wrapper = await mountSuspended(RHour, { props: {} as never });

        const input = wrapper.find("input").element as HTMLInputElement;
        expect(typeInto(input, "1230")).toBe("12:30");

        wrapper.unmount();

        expect(typeInto(input, "0945")).toBe("0945");
    });
});
