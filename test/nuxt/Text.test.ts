import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { RText } from "#components";

describe("RText", () => {
    it("renders an <input> element of type text", async () => {
        const wrapper = await mountSuspended(RText);
        const input = wrapper.find("input");
        expect(input.exists()).toBe(true);
        expect(input.attributes("type")).toBe("text");
    });

    it("reflects modelValue prop in the input", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { modelValue: "hello" } as never
        });

        const input = wrapper.find("input");
        expect((input.element as HTMLInputElement).value).toBe("hello");
    });

    it("emits update:modelValue when the input changes", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { modelValue: "" } as never
        });

        const input = wrapper.find("input");
        await input.setValue("typed");

        const emits = wrapper.emitted("update:modelValue");
        expect(emits).toBeTruthy();
        expect(emits?.at(-1)?.[0]).toBe("typed");
    });

    it("applies the name attribute on the input", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { name: "username", modelValue: "" } as never
        });

        expect(wrapper.find("input").attributes("name")).toBe("username");
    });
});