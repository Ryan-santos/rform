// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h, nextTick } from "vue";
import { RObject, RText } from "#components";

describe("RObject", () => {
    it("renders the default slot inside its group container", async () => {
        const wrapper = await mountSuspended(RObject, {
            slots: { default: () => h("span", { "data-testid": "child" }, "ok") }
        });

        expect(wrapper.find('[data-testid="child"]').text()).toBe("ok");
    });

    it("propagates child mutations into the shared modelValue object (in-place)", async () => {
        const sharedModel: Record<string, unknown> = {};

        const Parent = defineComponent({
            setup: () => () =>
                h(
                    RObject,
                    { modelValue: sharedModel } as never,
                    { default: () => h(RText, { name: "alpha", modelValue: "" } as never) }
                )
        });

        const wrapper = await mountSuspended(Parent);
        await wrapper.find("input").setValue("typed");
        await nextTick();

        expect(sharedModel.alpha).toBe("typed");
    });
});