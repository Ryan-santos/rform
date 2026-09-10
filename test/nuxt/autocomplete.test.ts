import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";

import { RDate, RDynamic, RHour, RNumber, RPin, RText, RTextarea } from "#components";

vi.mock("#rform/defaults", () => ({
    default: {
        Text: {
            autocomplete: "off"
        }
    }
}));

/**
 * `autocomplete` é prop, não atributo de fallthrough: com um `<div>` na raiz, o que
 * se escreve na tag pousa no wrapper, onde o navegador não o lê. Ver "A prop
 * `autocomplete`" no `.claude/CLAUDE.md`.
 */
describe("a prop autocomplete", () => {
    it("chega no input do RText", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { autocomplete: "username" } as never
        });

        expect(wrapper.find("input").attributes("autocomplete")).toBe("username");
    });

    it("chega no textarea do RTextarea", async () => {
        const wrapper = await mountSuspended(RTextarea, {
            props: { autocomplete: "street-address" } as never
        });

        expect(wrapper.find("textarea").attributes("autocomplete")).toBe("street-address");
    });

    it("chega no input do RNumber", async () => {
        const wrapper = await mountSuspended(RNumber, {
            props: { autocomplete: "postal-code" } as never
        });

        expect(wrapper.find("input").attributes("autocomplete")).toBe("postal-code");
    });

    it("não emite atributo nenhum quando a prop está ausente", async () => {
        const wrapper = await mountSuspended(RNumber);

        expect(wrapper.find("input").attributes("autocomplete")).toBeUndefined();
    });

    // Nos multi-input o atributo é do primeiro: `id` não, mas o preenchedor casa o
    // par pelo primeiro campo, e num Pin é onde o `one-time-code` tem que estar.
    it("marca só o primeiro input de um RDate em range", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { mode: "range", autocomplete: "bday" } as never
        });

        const inputs = wrapper.findAll("input");
        expect(inputs.length).toBeGreaterThan(1);
        expect(inputs.map((i) => i.attributes("autocomplete"))).toEqual([
            "bday",
            ...inputs.slice(1).map(() => undefined)
        ]);
    });

    // O RDate tem dois `<input>` alternativos para o `mode`, e só um renderiza:
    // esquecer um dos ramos deixa o atributo sumir num modo só, calado.
    it("chega no input do RDate em modo multiple", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { mode: "multiple", autocomplete: "bday" } as never
        });

        expect(wrapper.find("input").attributes("autocomplete")).toBe("bday");
    });

    it("marca só o primeiro input de um RHour em range", async () => {
        const wrapper = await mountSuspended(RHour, {
            props: { range: true, autocomplete: "off" } as never
        });

        const inputs = wrapper.findAll("input");
        expect(inputs.length).toBeGreaterThan(1);
        expect(inputs.map((i) => i.attributes("autocomplete"))).toEqual([
            "off",
            ...inputs.slice(1).map(() => undefined)
        ]);
    });

    it("marca só o primeiro input de um RPin", async () => {
        const wrapper = await mountSuspended(RPin, {
            props: { length: 4, autocomplete: "one-time-code" } as never
        });

        const inputs = wrapper.findAll("input");
        expect(inputs).toHaveLength(4);
        expect(inputs.map((i) => i.attributes("autocomplete"))).toEqual([
            "one-time-code",
            undefined,
            undefined,
            undefined
        ]);
    });

    it("alcança pelo defineFieldDefaults", async () => {
        const wrapper = await mountSuspended(RText);

        expect(wrapper.find("input").attributes("autocomplete")).toBe("off");
    });

    it("é sobrescrita na tag pelo que o defineFieldDefaults padronizou", async () => {
        const wrapper = await mountSuspended(RText, {
            props: { autocomplete: "current-password" } as never
        });

        expect(wrapper.find("input").attributes("autocomplete")).toBe("current-password");
    });

    // Sendo prop declarada, o `rest` do `RDynamic` a entrega como prop e não como
    // atributo de fallthrough — que é o que a poria de volta no wrapper.
    it("atravessa o modo schema até o input", async () => {
        const wrapper = await mountSuspended(RDynamic, {
            props: {
                schema: {
                    usuario: { type: "text", autocomplete: "username" }
                }
            } as never
        });

        expect(wrapper.find("input").attributes("autocomplete")).toBe("username");
    });
});