import { describe, expect, it } from "vitest";

import hookUi from "../../src/runtime/utils/hookUi";

/**
 * A classe em que `src/runtime/style.css` se ancora. O modo de falha é sempre
 * calado: sem ela o campo compila e renderiza igual, só que sem reset nenhum.
 */
describe("hookUi", () => {
    it("prepende na entrada mais alta", () => {
        expect(
            hookUi({ container: "flex gap-1", group: { input: "p-2" } }, "RField RText")
        ).toEqual({ container: "RField RText flex gap-1", group: { input: "p-2" } });
    });

    it("prepende num ui que é string pelada", () => {
        expect(hookUi("ml-1 text-sm", "RUtil RUtilsDescription")).toBe(
            "RUtil RUtilsDescription ml-1 text-sm"
        );
    });

    it("fica sozinha quando não há em que prepender", () => {
        expect(hookUi(undefined, "RField RText")).toBe("RField RText");
        expect(hookUi({ container: "" }, "RField RText")).toEqual({ container: "RField RText" });
    });

    // A razão de a classe entrar aqui e não nos defaults: `ui` é sobrescrevível por
    // contrato, e o `mergerUI` lê `null` como "zera esta chave".
    it("sobrevive a uma entrada mais alta que o app zerou", () => {
        expect(hookUi({ container: null, group: "grid" }, "RField RText")).toEqual({
            container: "RField RText",
            group: "grid"
        });
    });

    // O `RUtilsLoading` abre num `<Transition>`, cujo `ui.transition` são nomes de
    // transição, não uma lista de classes.
    it("pula um grupo aninhado até a primeira lista de classes", () => {
        expect(hookUi({ transition: { name: "" }, icon: "m-3" }, "RUtil RUtilsLoading")).toEqual({
            transition: { name: "" },
            icon: "RUtil RUtilsLoading m-3"
        });
    });

    it("deixa em paz um ui só de grupos", () => {
        const ui = { transition: { name: "" } };

        expect(hookUi(ui, "RUtil RUtilsLoading")).toBe(ui);
    });

    it("deixa em paz um componente sem gancho", () => {
        const ui = { container: "flex" };

        expect(hookUi(ui, undefined)).toBe(ui);
    });

    // O `ui` mesclado ainda pode ser o próprio objeto que o componente declarou em
    // escopo de módulo, então escrever nele poluiria os defaults do processo inteiro.
    it("não toca no objeto que recebeu", () => {
        const ui = { container: "flex" };

        hookUi(ui, "RField RText");

        expect(ui).toEqual({ container: "flex" });
    });
});