// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { RSelect } from "#components";

/**
 * The popover mounts its contents on first open, so every option assertion has
 * to open it first — the same click a user makes.
 */
const open = async (wrapper: { findAll: (s: string) => { trigger: (e: string) => Promise<void> }[] }) => {
    await wrapper.findAll("div")[1]!.trigger("click");
};

describe("RSelect", () => {
    it("parses an array of primitives into options", async () => {
        const wrapper = await mountSuspended(RSelect, {
            props: { options: ["a", "b", "c"] } as never
        });

        await open(wrapper);

        const items = wrapper.findAll("li");
        expect(items).toHaveLength(3);
        expect(items.map(i => i.text())).toEqual(["a", "b", "c"]);
    });

    it("parses an object {key: label} into options", async () => {
        const wrapper = await mountSuspended(RSelect, {
            props: { options: { foo: "Foo Label", bar: "Bar Label" } } as never
        });

        await open(wrapper);

        const labels = wrapper.findAll("li").map(li => li.text());
        expect(labels).toContain("Foo Label");
        expect(labels).toContain("Bar Label");
    });

    it("selects an item on click (single, primitive)", async () => {
        const wrapper = await mountSuspended(RSelect, {
            props: { options: ["a", "b"] } as never
        });

        await open(wrapper);
        await wrapper.findAll("li")[1]!.trigger("click");
        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("b");
    });

    it("stores selections as an array when multiple is true", async () => {
        const wrapper = await mountSuspended(RSelect, {
            props: { options: ["a", "b"], multiple: true, modelValue: [] } as never
        });

        await open(wrapper);
        await wrapper.findAll("li")[0]!.trigger("click");
        const emits = wrapper.emitted("update:modelValue");
        expect(Array.isArray(emits?.at(-1)?.[0])).toBe(true);
        expect(emits?.at(-1)?.[0]).toEqual(["a"]);
    });
});