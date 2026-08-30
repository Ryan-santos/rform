// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { computed, defineComponent, h, provide, ref } from "vue";
import useInjection, { keyProp } from "../../src/runtime/composables/useInjection";
import useUtilProps from "../../src/runtime/composables/useUtilProps";

vi.mock("#rform/defaults", () => ({
    default: {
        Text: {
            default: "from-user-defaults",
            ui: {
                container: "user-container"
            }
        },
        Utils: {
            Placeholder: {
                ui: {
                    default: "user-placeholder"
                }
            }
        }
    }
}));

type Rendered = {
    default?: unknown
    ui?: { container?: string }
};

const render = (props: Rendered) =>
    h("pre", { "data-testid": "field" }, JSON.stringify({
        default: props.default,
        container: props.ui?.container
    }));

const sourceProps = { type: Object, required: true } as const;

const TextField = defineComponent({
    props: { sourceProps },
    async setup (props) {
        const ctx = await useInjection(props.sourceProps as never, undefined, "Text");
        return () => render(ctx.props.value as Rendered);
    }
});

const NumberField = defineComponent({
    props: { sourceProps },
    async setup (props) {
        const ctx = await useInjection(props.sourceProps as never, undefined, "Number");
        return () => render(ctx.props.value as Rendered);
    }
});

const read = (wrapper: { get: (selector: string) => { text: () => string } }, testId: string) =>
    JSON.parse(wrapper.get(`[data-testid="${testId}"]`).text());

describe("user defaults (app/rform/defaults.ts)", () => {
    it("override the component's own defaults", async () => {
        const wrapper = await mountSuspended(TextField, {
            props: { sourceProps: {} }
        });

        const payload = read(wrapper, "field");

        expect(payload.default).toBe("from-user-defaults");
        expect(payload.container).toContain("user-container");
    });

    it("lose to the props passed at the call site", async () => {
        const wrapper = await mountSuspended(TextField, {
            props: { sourceProps: { default: "from-call-site" } }
        });

        expect(read(wrapper, "field").default).toBe("from-call-site");
    });

    it("only reach the component they are keyed under", async () => {
        const wrapper = await mountSuspended(NumberField, {
            props: { sourceProps: {} }
        });

        const payload = read(wrapper, "field");

        expect(payload.default).not.toBe("from-user-defaults");
        expect(payload.container).not.toContain("user-container");
    });
});

const Util = defineComponent({
    async setup () {
        const { props } = await useUtilProps("Placeholder");

        return () =>
            h("pre", { "data-testid": "util" }, JSON.stringify({
                placeholder: props.value.placeholder,
                ui: props.value.ui
            }));
    }
});

const UtilParent = defineComponent({
    setup () {
        provide(keyProp, {
            id: null,
            props: computed(() => ({ placeholder: "from-parent" })) as never,
            model: ref("") as never
        });

        return () => h(Util);
    }
});

describe("user defaults for Utils", () => {
    it("override the util's own defaults, under the Utils key", async () => {
        const wrapper = await mountSuspended(UtilParent);
        const payload = read(wrapper, "util");

        expect(payload.ui.default).toContain("user-placeholder");
        expect(payload.placeholder).toBe("from-parent");
    });
});
