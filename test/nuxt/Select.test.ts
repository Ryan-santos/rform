import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { RSelect } from "#components";

// O popover só monta o conteúdo no primeiro `open`, então toda asserção sobre
// opção precisa abri-lo antes — o mesmo clique que um usuário dá.
const open = async (wrapper: {
    findAll: (s: string) => { trigger: (e: string) => Promise<void> }[];
}) => {
    await wrapper.findAll("div")[1]!.trigger("click");
};

describe("RSelect", () => {
    it("transforma um array de primitivos em opções", async () => {
        const wrapper = await mountSuspended(RSelect, {
            props: { options: ["a", "b", "c"] } as never
        });

        await open(wrapper);

        const items = wrapper.findAll("li");
        expect(items).toHaveLength(3);
        expect(items.map((i) => i.text())).toEqual(["a", "b", "c"]);
    });

    it("transforma um objeto {chave: rótulo} em opções", async () => {
        const wrapper = await mountSuspended(RSelect, {
            props: { options: { foo: "Foo Label", bar: "Bar Label" } } as never
        });

        await open(wrapper);

        const labels = wrapper.findAll("li").map((li) => li.text());
        expect(labels).toContain("Foo Label");
        expect(labels).toContain("Bar Label");
    });

    it("seleciona um item no clique (single, primitivo)", async () => {
        const wrapper = await mountSuspended(RSelect, {
            props: { options: ["a", "b"] } as never
        });

        await open(wrapper);
        await wrapper.findAll("li")[1]!.trigger("click");
        const emits = wrapper.emitted("update:modelValue");
        expect(emits?.at(-1)?.[0]).toBe("b");
    });

    it("guarda as seleções num array quando multiple é true", async () => {
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