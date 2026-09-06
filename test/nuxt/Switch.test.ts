import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

// O fixture substitui o `Switch` embutido, então a tag `RSwitch` resolve para o
// componente do usuário — o embutido só chega aqui pelo alias.
import RSwitch from "#rform/builtin/fields/Switch.vue";

describe("RSwitch", () => {
    it("resolve o placeholder pelo tr em vez de imprimir a chave", async () => {
        const wrapper = await mountSuspended(RSwitch, {
            props: { placeholder: "rform.presets.rules.required" } as never
        });

        expect(wrapper.text()).toContain("Campo obrigatório.");
        expect(wrapper.text()).not.toContain("rform.presets.rules.required");
    });
});