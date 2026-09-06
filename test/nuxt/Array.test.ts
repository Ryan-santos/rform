import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { defineComponent, h, nextTick } from "vue";

import { RArray } from "#components";

describe("RArray", () => {
    it("renderiza um <li> por item, mais o botão de adicionar", async () => {
        const Item = defineComponent({
            props: ["item", "index"],
            setup: (p) => () => h("span", { "data-testid": `item-${p.index}` }, String(p.item))
        });

        const wrapper = await mountSuspended(RArray, {
            props: { modelValue: ["x", "y"] } as never,
            slots: {
                default: (scope: { item: unknown; index: number }) =>
                    h(Item, { item: scope.item, index: scope.index })
            }
        });

        expect(wrapper.findAll('[data-testid^="item-"]')).toHaveLength(2);
        expect(wrapper.find("button").exists()).toBe(true);
    });

    it("empurra uma entrada nova no array do model ao clicar em adicionar", async () => {
        const arr: unknown[] = ["a"];
        const wrapper = await mountSuspended(RArray, {
            props: { modelValue: arr } as never,
            slots: { default: () => h("span") }
        });

        await wrapper.find("button").trigger("click");
        await nextTick();
        expect(arr).toHaveLength(2);
    });

    it("esconde o botão de adicionar quando o max é atingido", async () => {
        const wrapper = await mountSuspended(RArray, {
            props: { modelValue: ["a", "b"], max: 2 } as never,
            slots: { default: () => h("span") }
        });

        expect(wrapper.find("button").exists()).toBe(false);
    });

    it("esconde o ícone de remover quando o tamanho iguala o min", async () => {
        const wrapper = await mountSuspended(RArray, {
            props: { modelValue: ["only"], min: 1 } as never,
            slots: { default: () => h("span") }
        });

        const icons = wrapper.findAll('[class*="cursor-pointer"]');
        expect(icons).toHaveLength(0);
    });
});