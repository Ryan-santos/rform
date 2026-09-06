import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { RText } from "#components";

describe("RText", () => {
    it("renderiza um <input> do tipo text", async () => {
        const wrapper = await mountSuspended(RText);
        const input = wrapper.find("input");
        expect(input.exists()).toBe(true);
        expect(input.attributes("type")).toBe("text");
    });

    it("reflete a prop modelValue no input", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { modelValue: "hello" } as never
        });

        const input = wrapper.find("input");
        expect((input.element as HTMLInputElement).value).toBe("hello");
    });

    it("emite update:modelValue quando o input muda", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("typed");

        const emits = wrapper.emitted("update:modelValue");
        expect(emits).toBeTruthy();
        expect(emits?.at(-1)?.[0]).toBe("typed");
    });

    it("aplica o atributo name no input", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { name: "username", modelValue: "" } as never
        });

        expect(wrapper.find("input").attributes("name")).toBe("username");
    });
});