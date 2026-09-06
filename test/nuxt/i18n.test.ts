import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import { useState } from "#app";
import { RArray, RCalendar, RDate, RForm, RHour, RText } from "#components";

/**
 * A fixture **não** tem i18n, de propósito: é ela que cobre o resolvedor próprio,
 * e a ponte quem exercita é o playground. `rform-locale` é a chave de `useState`
 * em que o `useTranslate` cai.
 */
const setLocale = async (code: string) => {
    useState<string>("rform-locale").value = code;
    await nextTick();
};

describe("troca de idioma", () => {
    it("renderiza em pt-BR por padrão", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        expect(wrapper.text()).toContain("Incluir");
    });

    it("re-renderiza um campo quando o locale muda", async () => {
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

    it("prefere o pack do usuário ao embutido, no mesmo code", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        // O pack da fixture sobrescreve só esta chave; todo o resto continua vindo do
        // pack embutido.
        expect(wrapper.text()).toContain("Incluir");
        expect(wrapper.text()).not.toContain("Adicionar");
    });

    it("alarga um code de língua pelada para o pack que existe", async () => {
        await setLocale("en-GB");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        expect(wrapper.text()).toContain("Add");

        await setLocale("pt-BR");
    });
});

describe("a prop text e a procedência dela", () => {
    it("renderiza o pack do próprio módulo quando nada é passado", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [] } as never
        });

        expect(wrapper.text()).toContain("Incluir");
    });

    it("pega a prop crua — sem prefixo, e a fixture não tem ponte, então imprime", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [], text: { button: "form.adicionar" } } as never
        });

        expect(wrapper.text()).toContain("form.adicionar");
        expect(wrapper.text()).not.toContain("Incluir");
    });

    it("é a identidade para `~~` sem ponte — a assimetria aceita", async () => {
        await setLocale("pt-BR");

        const wrapper = await mountSuspended(RArray, {
            props: { name: "itens", modelValue: [], text: { button: "~~Nome" } } as never
        });

        expect(wrapper.text()).toContain("~~Nome");
    });
});

// Um campo só registra o validador quando um Form provê o registro de rules, então
// isto passa pela cadeia de verdade: useField → resolveRule → validation.
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
            // O `validate` rejeita no primeiro campo que falha; o que se asserta é a
            // mensagem, e ela pousa no próprio campo.
        }

        await nextTick();

        return wrapper.text();
    };
};

describe("mensagens de rule", () => {
    it("reporta no locale ativo", async () => {
        await setLocale("en");

        const validate = await mountField("required", { campo: "" });
        expect(await validate()).toContain("Required field.");

        await setLocale("pt-BR");

        const other = await mountField("required", { campo: "" });
        expect(await other()).toContain("Campo obrigatório.");
    });

    it("interpola o arg na mensagem traduzida", async () => {
        await setLocale("en");

        const validate = await mountField({ name: "min", min: 8 }, { campo: "ab" });
        expect(await validate()).toContain("At least 8 characters.");

        await setLocale("pt-BR");
    });
});

describe("formatação de data", () => {
    it("segue o formats.date quando o locale muda", async () => {
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

    it("mantém o model em ISO qualquer que seja o formato de exibição", async () => {
        await setLocale("en");

        const wrapper = await mountSuspended(RDate, {
            props: { modelValue: "" } as never
        });

        await wrapper.find("input").setValue("12/31/2026");
        await nextTick();

        expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBe("2026-12-31");

        await setLocale("pt-BR");
    });

    it("nomeia meses e dias da semana pelo Intl do locale ativo", async () => {
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

    it("traduz o separador do range", async () => {
        await setLocale("en");

        const wrapper = await mountSuspended(RHour, {
            props: { range: true, modelValue: [undefined, undefined] } as never
        });

        expect(wrapper.text()).toContain("to");
        expect(wrapper.text()).not.toContain("até");

        await setLocale("pt-BR");
    });
});