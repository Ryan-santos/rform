import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import { useState } from "#app";
import { RArray, RCalendar, RDate, RForm, RHour, RText } from "#components";

/**
 * The fixture ships **no** `@nuxtjs/i18n`, on purpose: it is what covers the
 * module's own resolver. The bridge is exercised by the playground.
 *
 * `rform-locale` is the `useState` key `useTranslate` falls back to.
 */
const setLocale = async (code: string) => {
    useState<string>("rform-locale").value = code;
    await nextTick();
};

describe("locale switching", () => {
    it("renders in pt-BR by default", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        expect(wrapper.text()).toContain("Incluir");
    });

    it("re-renders a field when the locale changes", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        await setLocale("en");
        await nextTick();

        expect(wrapper.text()).toContain("Add");
        expect(wrapper.text()).not.toContain("Incluir");

        await setLocale("pt-BR");
        await nextTick();

        expect(wrapper.text()).toContain("Incluir");
    });

    it("takes a user pack over the built-in for the same code", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        // `test/fixtures/basic/rform/locales/pt-BR.ts` only overrides this key;
        // everything else still comes from the built-in pack.
        expect(wrapper.text()).toContain("Incluir");
        expect(wrapper.text()).not.toContain("Adicionar");
    });

    it("widens a bare language code to the pack that ships", async () => {
        await setLocale("en-GB");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        expect(wrapper.text()).toContain("Add");

        await setLocale("pt-BR");
    });
});

describe("the text prop and its provenance", () => {
    it("renders the module's own pack when nothing is passed", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        expect(wrapper.text()).toContain("Incluir");
    });

    it("takes a prop raw — no prefix, and the fixture has no bridge, so it prints", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [], text: { button: "form.adicionar" } } as never
        });

        expect(wrapper.text()).toContain("form.adicionar");
        expect(wrapper.text()).not.toContain("Incluir");
    });

    it("is the identity for `~~` without a bridge — decision 9", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [], text: { button: "~~Nome" } } as never
        });

        expect(wrapper.text()).toContain("~~Nome");
    });
});

/**
 * A field only registers its validator when a Form provides the rules list, so
 * this goes through the real chain: useField → resolveRule → validation.
 */
const mountField = async (rule: unknown, model: Record<string, unknown>) => {
    let scope: { validate: () => Promise<void> } | undefined;

    const wrapper = await mountSuspended(RForm, {
        props: { modelValue: model } as never,
        slots: {
            default: (received: Record<string, unknown>) => {
                scope = received as unknown as { validate: () => Promise<void> };
                return h(RText, { name: "campo", rule } as never);
            }
        }
    });

    return async () => {
        try {
            await scope!.validate();
        } catch {
            // `validate` rejects on the first failing field; the message is what
            // this asserts on, and it lands on the field itself.
        }

        await nextTick();

        return wrapper.text();
    };
};

describe("rule messages", () => {
    it("reports in the active locale", async () => {
        await setLocale("en");

        const validate = await mountField("required", { campo: "" });
        expect(await validate()).toContain("Required field.");

        await setLocale("pt-BR");

        const other = await mountField("required", { campo: "" });
        expect(await other()).toContain("Campo obrigatório.");
    });

    it("interpolates the arg into the translated message", async () => {
        await setLocale("en");

        const validate = await mountField({ name: "min", min: 8 }, { campo: "ab" });
        expect(await validate()).toContain("At least 8 characters.");

        await setLocale("pt-BR");
    });
});

describe("date formatting", () => {
    it("follows formats.date when the locale changes", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RDate, {
            props: { modelValue: "2026-05-15" } as never
        });

        const input = wrapper.find("input");
        expect((input.element as HTMLInputElement).value).toBe("15/05/2026");
        expect(input.attributes("placeholder")).toBe("dd/mm/aaaa");

        await setLocale("en");
        await nextTick();

        expect((input.element as HTMLInputElement).value).toBe("05/15/2026");
        expect(input.attributes("placeholder")).toBe("mm/dd/yyyy");

        await setLocale("pt-BR");
    });

    it("keeps the model in ISO whatever the display format is", async () => {
        await setLocale("en");

        const wrapper = await mountSuspended(RDate, {
            props: { modelValue: "" } as never
        });

        await wrapper.find("input").setValue("12/31/2026");
        await nextTick();

        expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBe("2026-12-31");

        await setLocale("pt-BR");
    });

    it("names months and weekdays through Intl of the active locale", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RCalendar, {
            props: { modelValue: "2026-05-15" } as never
        });

        expect(wrapper.text()).toContain("Maio");
        expect(wrapper.text()).toContain("dom");

        await setLocale("en");
        await nextTick();

        expect(wrapper.text()).toContain("May");
        expect(wrapper.text()).toContain("Sun");
        expect(wrapper.text()).not.toContain("Maio");

        await setLocale("pt-BR");
    });

    it("translates the range separator", async () => {
        await setLocale("en");

        const wrapper = await mountSuspended(RHour, {
            props: { range: true, modelValue: [undefined, undefined] } as never
        });

        expect(wrapper.text()).toContain("to");
        expect(wrapper.text()).not.toContain("até");

        await setLocale("pt-BR");
    });
});