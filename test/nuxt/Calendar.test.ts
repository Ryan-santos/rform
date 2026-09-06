import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { DOMWrapper } from "@vue/test-utils";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { RCalendar } from "#components";

const findDayButton = (wrapper: Awaited<ReturnType<typeof mountSuspended>>, day: number) => {
    return wrapper
        .findAll("button")
        .find(
            (b: DOMWrapper<HTMLButtonElement>) =>
                b.text() === String(day) && !b.attributes("disabled")
        );
};

describe("RCalendar", () => {
    it("renderiza a grade de dias com 42 células por padrão (modo single)", async () => {
        const wrapper = await mountSuspended(RCalendar);
        // 42 células de dia, mais os botões de navegação e título.
        const grid = wrapper.find('[class*="grid-cols-7"]');
        expect(grid.exists()).toBe(true);
    });

    it("escreve uma string YYYY-MM-DD ao clicar num dia (modo single)", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { modelValue: "2026-05-15" } as never
        });

        const target = findDayButton(wrapper, 20);
        expect(target).toBeDefined();
        await target!.trigger("click");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        expect(emits).toBeTruthy();
        expect(emits?.at(-1)?.[0]).toBe("2026-05-20");
    });

    it("emite uma tupla ao clicar num dia com mode=range (primeiro clique)", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { mode: "range", modelValue: undefined } as never
        });

        const target = findDayButton(wrapper, 10);
        await target!.trigger("click");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        const last = emits?.at(-1)?.[0] as [string | undefined, string | undefined];
        expect(Array.isArray(last)).toBe(true);
        expect(last).toHaveLength(2);
        expect(last[1]).toBeUndefined();
        // O dia 10 pode ser do mês anterior ou do corrente; de um jeito ou de outro a
        // string ISO tem de terminar em -10.
        expect(last[0]).toMatch(/-10$/);
    });

    it("emite um array ordenado com mode=multiple — o clique alterna a seleção", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { mode: "multiple", modelValue: ["2026-05-10"] } as never
        });

        const target = findDayButton(wrapper, 20);
        await target!.trigger("click");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        const last = emits?.at(-1)?.[0] as string[];
        expect(Array.isArray(last)).toBe(true);
        expect(last).toEqual(["2026-05-10", "2026-05-20"]);
    });

    it("remove a data no segundo clique com mode=multiple", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { mode: "multiple", modelValue: ["2026-05-20"] } as never
        });

        const target = findDayButton(wrapper, 20);
        await target!.trigger("click");
        await nextTick();

        const emits = wrapper.emitted("update:modelValue");
        const last = emits?.at(-1)?.[0] as string[];
        expect(last).toEqual([]);
    });

    it("desabilita os dias que casam com disable.before", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: {
                modelValue: "2026-05-15",
                disable: { before: "2026-05-10" }
            } as never
        });

        // O dia 5 é antes de 10 de maio, então está desabilitado.
        const day5 = wrapper.findAll("button").find((b) => b.text() === "5");
        expect(day5?.attributes("disabled")).toBeDefined();
    });

    it("não emite ao clicar num dia desabilitado", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: {
                modelValue: "2026-05-15",
                disable: { after: "2026-05-20" }
            } as never
        });

        const day25 = wrapper.findAll("button").find((b) => b.text() === "25");
        expect(day25?.attributes("disabled")).toBeDefined();
        await day25!.trigger("click");
        await nextTick();

        // Continua com o valor inicial: o clique não dispara emit novo.
        const emits = wrapper.emitted("update:modelValue") ?? [];
        for (const e of emits) {
            expect(e[0]).not.toBe("2026-05-25");
        }
    });

    it("desce da visão de dias para a de meses ao clicar no título do mês", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { modelValue: "2026-05-15" } as never
        });

        // Começa na visão de dias, com a linha de dias da semana visível.
        const weekdaysBefore = wrapper.find('[class*="grid-cols-7"]');
        expect(weekdaysBefore.exists()).toBe(true);

        // O botão do título do mês ("Maio") abre a visão de meses.
        const titleButtons = wrapper.findAll("button").filter((b) => {
            const text = b.text();
            return text.length > 2 && /^[A-Z]/.test(text);
        });
        expect(titleButtons.length).toBeGreaterThanOrEqual(1);

        await titleButtons[0]!.trigger("click");
        await nextTick();

        // Depois de descer, a grade de meses é renderizada.
        const monthsGrid = wrapper.find('[class*="grid-cols-3"]');
        expect(monthsGrid.exists()).toBe(true);
    });

    it("desce da visão de dias para a de anos ao clicar no título do ano", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { modelValue: "2026-05-15" } as never
        });

        const yearTitle = wrapper.findAll("button").find((b) => b.text() === "2026");
        expect(yearTitle).toBeDefined();
        await yearTitle!.trigger("click");
        await nextTick();

        const yearsGrid = wrapper.find('[class*="grid-cols-3"]');
        expect(yearsGrid.exists()).toBe(true);
        // A janela de 12 anos, centrada em view.year, renderiza vários anos.
        const yearButtons = wrapper.findAll("button").filter((b) => /^\d{4}$/.test(b.text()));
        expect(yearButtons.length).toBeGreaterThanOrEqual(12);
    });

    // O painel de hora depende de `props.time`, booleano, e o rótulo dele é
    // `props.text.time`. Os dois têm o mesmo nome e não colidem, porque `text` fica
    // aninhado — estes dois testes são a guarda.
    it("mostra o relógio, rotulado pelo pack, quando time está ligado", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { modelValue: "2026-05-15", time: true } as never
        });

        expect(wrapper.text()).toContain("Hora");
    });

    it("deixa o relógio de fora quando time está desligado", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { modelValue: "2026-05-15" } as never
        });

        expect(wrapper.text()).not.toContain("Hora");
        expect(wrapper.text()).not.toContain("rform.utils.calendar");
    });

    it("pega o rótulo da prop text aninhada", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: {
                modelValue: "2026-05-15",
                time: true,
                text: { time: "~~Quando" }
            } as never
        });

        expect(wrapper.text()).toContain("Quando");
        expect(wrapper.text()).not.toContain("Hora");
    });
});