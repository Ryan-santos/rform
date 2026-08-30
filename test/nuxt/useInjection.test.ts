// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h, provide, ref } from "vue";
import type { Element } from "#rform/types";
import useInjection, { key } from "../../src/runtime/composables/useInjection";

const Harness = defineComponent({
    props: {
        sourceProps: { type: Object, required: true },
        modelValue: { type: null, default: undefined }
    },
    async setup (props) {
        const ctx = await useInjection(
            props.sourceProps as Element,
            undefined,
            "Text"
        );
        return () =>
            h("pre", { "data-testid": "merged" }, JSON.stringify({
                id: ctx.id,
                modelValue: ctx.props.value.modelValue,
                defaultValue: ctx.props.value.default,
                name: ctx.props.value.name
            }));
    }
});

describe("useInjection", () => {
    it("loads component defaults and merges over source props", async () => {
        const wrapper = await mountSuspended(Harness, {
            props: { sourceProps: { name: "field-a" } }
        });

        const payload = JSON.parse(wrapper.get('[data-testid="merged"]').text());
        expect(payload.defaultValue).toBe("");
        expect(payload.name).toBe("field-a");
    });

    it("returns id as null when no parent + no name", async () => {
        const wrapper = await mountSuspended(Harness, {
            props: { sourceProps: {} }
        });

        const payload = JSON.parse(wrapper.get('[data-testid="merged"]').text());
        expect(payload.id).toBeNull();
    });

    it("syncs the child model into the parent model when name is set", async () => {
        const parentModel = ref<Record<string, unknown>>({ child: "from-parent" });

        const Child = defineComponent({
            props: {
                modelValue: { type: null, default: undefined }
            },
            async setup () {
                const ctx = await useInjection(
                    { name: "child", modelValue: undefined } as never,
                    undefined,
                    "Text"
                );
                return () => h("p", { "data-testid": "current" }, String(ctx.model.value));
            }
        });

        const Wrapper = defineComponent({
            setup () {
                provide(key, { id: "root", model: parentModel as never });
                return () => h(Child);
            }
        });

        const wrapper = await mountSuspended(Wrapper);
        expect(wrapper.get('[data-testid="current"]').text()).toBe("from-parent");
    });
});