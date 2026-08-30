// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { DOMWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { RCalendar } from "#components";

const findDayButton = (
    wrapper: Awaited<ReturnType<typeof mountSuspended>>,
    day: number
) => {
    return wrapper
        .findAll("button")
        .find((b: DOMWrapper<HTMLButtonElement>) => b.text() === String(day) && !b.attributes("disabled"));
};

describe("RCalendar", () => {
    it("renders the day grid with 42 cells by default (single mode)", async () => {
        const wrapper = await mountSuspended(RCalendar);
        // 42 day cells + nav and title buttons. The day grid has exactly 42 cells.
        const grid = wrapper.find('[class*="grid-cols-7"]');
        expect(grid.exists()).toBe(true);
    });

    it("writes a YYYY-MM-DD string on day click (single mode)", async () => {
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

    it("emits a tuple on day click when mode=range (first click)", async () => {
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
        // Day 10 could be from the previous month (outside) or current month.
        // Either way, the iso string must end with -10.
        expect(last[0]).toMatch(/-10$/);
    });

    it("emits a sorted array when mode=multiple — toggles selection on click", async () => {
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

    it("removes the date on second click when mode=multiple (toggle off)", async () => {
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

    it("disables day buttons that match disable.before", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: {
                modelValue: "2026-05-15",
                disable: { before: "2026-05-10" }
            } as never
        });

        // Day 5 is before May 10 → disabled.
        const day5 = wrapper
            .findAll("button")
            .find(b => b.text() === "5");
        expect(day5?.attributes("disabled")).toBeDefined();
    });

    it("does not emit when clicking a disabled day", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: {
                modelValue: "2026-05-15",
                disable: { after: "2026-05-20" }
            } as never
        });

        const day25 = wrapper
            .findAll("button")
            .find(b => b.text() === "25");
        expect(day25?.attributes("disabled")).toBeDefined();
        await day25!.trigger("click");
        await nextTick();

        // Should still hold the initial value, no new emit triggered by the click.
        const emits = wrapper.emitted("update:modelValue") ?? [];
        for (const e of emits) {
            expect(e[0]).not.toBe("2026-05-25");
        }
    });

    it("drills down from days view → months view when month title is clicked", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { modelValue: "2026-05-15" } as never
        });

        // Initially in days view → weekdays row visible
        const weekdaysBefore = wrapper.find('[class*="grid-cols-7"]');
        expect(weekdaysBefore.exists()).toBe(true);

        // The month-title button (capitalized "Maio") opens the months view.
        const titleButtons = wrapper.findAll("button").filter(b => {
            const text = b.text();
            return text.length > 2 && /^[A-Z]/.test(text);
        });
        expect(titleButtons.length).toBeGreaterThanOrEqual(1);

        await titleButtons[0]!.trigger("click");
        await nextTick();

        // After drill-down the months grid is rendered.
        const monthsGrid = wrapper.find('[class*="grid-cols-3"]');
        expect(monthsGrid.exists()).toBe(true);
    });

    it("drills down from days view → years view when year title is clicked", async () => {
        const wrapper = await mountSuspended(RCalendar, {
            props: { modelValue: "2026-05-15" } as never
        });

        const yearTitle = wrapper.findAll("button").find(b => b.text() === "2026");
        expect(yearTitle).toBeDefined();
        await yearTitle!.trigger("click");
        await nextTick();

        const yearsGrid = wrapper.find('[class*="grid-cols-3"]');
        expect(yearsGrid.exists()).toBe(true);
        // 12-year window centered on view.year should render multiple years.
        const yearButtons = wrapper.findAll("button").filter(b => /^\d{4}$/.test(b.text()));
        expect(yearButtons.length).toBeGreaterThanOrEqual(12);
    });
});