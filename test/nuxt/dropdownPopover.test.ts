// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { RColor, RDate, RSelect } from "#components";

/**
 * O painel é do `RUtilsDropdown`, então o que vale para todo painel — o `z-999`
 * e o `w-(--width)` que o `dropdownFit` alimenta — é default dele, e cada campo
 * sobrescreve pelo mesmo endereço: `ui.Utils.Dropdown.popover`.
 *
 * O endereço único é o ponto, e o motivo de existir teste: um `class` cravado no
 * template do campo não passaria pelo `twMerge`, e duas classes de largura no
 * mesmo elemento se resolvem pela ordem da folha de estilo — `w-72` perderia
 * para um `w-(--width)` sem `--width` nenhum declarado, que renderiza
 * `width: auto`. Compila, não avisa, e o painel abre com a largura errada.
 */
const popover = (wrapper: { find: (s: string) => { classes: () => string[] } }) =>
    wrapper.find(".RUtilsDropdown").classes();

describe("dropdown popover", () => {
    it("puts z-999 on every panel, from the Dropdown's own defaults", async () => {
        for (const [component, props] of [
            [RSelect, { options: ["a"] }],
            [RDate, {}],
            [RColor, {}]
        ] as const) {
            const wrapper = await mountSuspended(component, { props: props as never });

            expect(popover(wrapper)).toContain("z-999");
        }
    });

    it("reads the measured width where the field measures one", async () => {
        const wrapper = await mountSuspended(RSelect, { props: { options: ["a"] } as never });

        expect(popover(wrapper)).toContain("w-(--width)");
    });

    it("drops w-(--width) for the fixed width of a field that measures none", async () => {
        for (const [component, width] of [[RDate, "w-72"], [RColor, "w-64"]] as const) {
            const wrapper = await mountSuspended(component, { props: {} as never });
            const classes = popover(wrapper);

            expect(classes).toContain(width);
            expect(classes).not.toContain("w-(--width)");
        }
    });

    it("drops w-(--width) when the ui writes another width", async () => {
        const wrapper = await mountSuspended(RSelect, {
            props: {
                options: ["a"],
                ui: { Utils: { Dropdown: { popover: "w-80" } } }
            } as never
        });

        const classes = popover(wrapper);

        expect(classes).toContain("w-80");
        expect(classes).not.toContain("w-(--width)");
        // O resto da aparência do painel sobrevive ao override de largura.
        expect(classes).toContain("overflow-auto");
        expect(classes).toContain("z-999");
    });
});
