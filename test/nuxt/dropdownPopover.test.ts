import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { RColor, RDate, RSelect } from "#components";

/**
 * Toda aparência de painel mora em `ui.Utils.Dropdown.popover`, e o endereço único é
 * o ponto: um `class` cravado no template do campo não passaria pelo `twMerge`, e o
 * painel abriria com a largura errada, calado. Ver "O painel é do Dropdown" no
 * `.claude/CLAUDE.md`.
 */
const popover = (wrapper: { find: (s: string) => { classes: () => string[] } }) =>
    wrapper.find(".RUtilsDropdown").classes();

describe("painel do dropdown", () => {
    it("põe z-999 em todo painel, pelos defaults do próprio Dropdown", async () => {
        for (const [component, props] of [
            [RSelect, { options: ["a"] }],
            [RDate, {}],
            [RColor, {}]
        ] as const) {
            const wrapper = await mountSuspended(component, { props: props as never });

            expect(popover(wrapper)).toContain("z-999");
        }
    });

    it("lê a largura medida onde o campo mede uma", async () => {
        const wrapper = await mountSuspended(RSelect, { props: { options: ["a"] } as never });

        expect(popover(wrapper)).toContain("w-(--width)");
    });

    it("troca w-(--width) pela largura fixa de um campo que não mede nada", async () => {
        for (const [component, width] of [
            [RDate, "w-72"],
            [RColor, "w-64"]
        ] as const) {
            const wrapper = await mountSuspended(component, { props: {} as never });
            const classes = popover(wrapper);

            expect(classes).toContain(width);
            expect(classes).not.toContain("w-(--width)");
        }
    });

    it("troca w-(--width) quando o ui escreve outra largura", async () => {
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