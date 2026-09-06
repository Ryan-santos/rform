import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { h } from "vue";

import { RForm, RText } from "#components";

// Por caminho, não por `#components`: este mora na fixture.
import RRating from "../fixtures/basic/rform/fields/Rating.vue";

/**
 * A classe que cada campo e util carrega na raiz, prependida na entrada mais alta
 * do `ui` pelo `useField` / `useUtil`. É o único alvo que os resets de
 * `src/runtime/style.css` têm, e o modo de falha é sempre calado: sem a classe o
 * campo compila e renderiza igual, só que sem reset nenhum.
 */
describe("classes-gancho na raiz", () => {
    it("marca um campo embutido com a genérica e a do componente", async () => {
        const wrapper = await mountSuspended(RText);

        expect(wrapper.find("div").classes()).toEqual(expect.arrayContaining(["RField", "RText"]));
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

    // A razão de a classe entrar **depois** do merge: o `mergerUI` lê `null` como
    // "zera esta chave", e declarada nos defaults o gancho sumiria junto.
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
     * de `<form>`, e `useField` lê o pai com `inject(key, undefined)`.
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