import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { RDate } from "#components";

describe("RUtilsPlaceholder", () => {
    it("não conta um range vazio como preenchido", async () => {
        const wrapper = await mountSuspended(RDate, {
            props: { mode: "range", modelValue: ["", ""], placeholder: "Período" } as never
        });

        expect(wrapper.find(".RUtilsPlaceholder").attributes("data-floating")).toBeUndefined();
    });

    it("sai da frente do hint de formato no foco, mesmo sem poder flutuar", async () => {
        const wrapper = await mountSuspended(RDate, {
            attachTo: document.body,
            props: { label: "Nascimento", placeholder: "Data de nascimento" } as never
        });

        const placeholder = () => wrapper.find(".RUtilsPlaceholder");

        // Com label o placeholder nunca flutua; parado, ele é o texto do campo.
        expect(placeholder().classes()).not.toContain("opacity-0");

        await wrapper.find("input").trigger("focusin");
        await nextTick();

        // No foco quem rotula é o hint nativo (`dd/mm/aaaa`), então ele tem de sumir.
        expect(placeholder().classes()).toContain("opacity-0");
    });
});