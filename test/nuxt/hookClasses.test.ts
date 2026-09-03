// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { h } from "vue";
import { RForm, RText } from "#components";
// By path, not `#components`: this one lives in the fixture.
import RRating from "../fixtures/basic/rform/fields/Rating.vue";

/**
 * The class each field and util carries on its root, prepended to the top-most
 * `ui` entry by `useInjection` / `useUtilProps` from the map the module
 * generates into `#rform/registry`. It is the only target the resets in
 * `src/runtime/style.css` have — the spinner reset, the two autofill tricks,
 * and the placeholder hidden under the browser's autofill preview.
 *
 * The failure mode is always the same and always silent: without the class the
 * field still compiles and renders, it just gets no reset at all.
 */
describe("classes-gancho na raiz", () => {
    it("marca um campo embutido com a genérica e a do componente", async () => {
        const wrapper = await mountSuspended(RText);

        expect(wrapper.find("div").classes()).toEqual(
            expect.arrayContaining(["RField", "RText"])
        );
    });

    it("marca um util com o prefixo dele", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { placeholder: "voce@empresa.com" }
        });

        expect(wrapper.find(".RUtilsPlaceholder").classes()).toContain("RUtil");
    });

    it("marca um campo de app/rform/fields igual a um embutido", async () => {
        const wrapper = await mountSuspended(RRating);

        expect(wrapper.find("div").classes()).toEqual(
            expect.arrayContaining(["RField", "RRating"])
        );
    });

    /**
     * A razão de a classe entrar **depois** do merge e não de dentro do
     * `defaults.ui`: `ui` é sobrescrevível por contrato, e o `mergerUI` trata
     * `null` como "zera esta chave". Declarada nos defaults, o gancho sumiria
     * junto — e um `container` que só troca classes ficaria à mercê do que o
     * `twMerge` decide descartar, num namespace que não é do Tailwind.
     */
    it("sobrevive a um ui.container zerado", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { ui: { container: null } } as never
        });

        expect(wrapper.find("div").classes()).toEqual(["RField", "RText"]);
    });

    it("sobrevive a um ui.container reescrito", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { ui: { container: "grid gap-8" } }
        });

        expect(wrapper.find("div").classes()).toEqual(
            expect.arrayContaining(["RField", "RText", "grid", "gap-8"])
        );
    });

    /**
     * O caso que ancorar em `.RForm` perdia: o autofill do browser não depende
     * de `<form>`, e `useInjection` lê o pai com `inject(key, undefined)`.
     */
    it("marca um campo usado sem RForm em volta", async () => {
        const solto = await mountSuspended(RText);
        const dentro = await mountSuspended(RForm, {
            slots: { default: () => h(RText, { name: "email" }) }
        });

        expect(solto.find("div").classes()).toContain("RField");
        expect(dentro.find(".RField").exists()).toBe(true);
    });

    /**
     * `Form` e `Dynamic` não são campos, e o mapa gerado só lista o que saiu de
     * um diretório `fields` — o `<form>` continua com o `RForm` que ele mesmo
     * escreve, e nada de `RField`.
     */
    it("não marca o Form", async () => {
        const wrapper = await mountSuspended(RForm);
        const classes = wrapper.find("form").classes();

        expect(classes).toContain("RForm");
        expect(classes).not.toContain("RField");
    });
});
