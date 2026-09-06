// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

import focusFirstError from "../../src/runtime/utils/focusFirstError";

// `scrollIntoView` não existe no happy-dom/jsdom: sem o stub a chamada é um no-op e
// não há o que asserir.
const scrollIntoView = vi.fn();

Element.prototype.scrollIntoView = scrollIntoView;

/** Dois campos, e o erro mora em qual deles é o parâmetro. */
const mount = (withError: Array<number>, focusable = [true, true]) => {
    const root = document.createElement("form");

    for (const index of [0, 1]) {
        const field = document.createElement("div");
        field.className = "RField RText";
        field.dataset.index = String(index);

        if (focusable[index]) {
            const input = document.createElement("input");
            input.name = `campo-${index}`;
            field.append(input);
        }

        if (withError.includes(index)) {
            const message = document.createElement("p");
            message.className = "RUtil RUtilsError";
            message.textContent = "erro";
            field.append(message);
        }

        root.append(field);
    }

    document.body.append(root);

    return root;
};

describe("focusFirstError", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        scrollIntoView.mockClear();
    });

    it("foca o campo em ordem de documento, não de registro", () => {
        const root = mount([1]);

        const focused = focusFirstError(root);

        expect((focused as HTMLInputElement)?.name).toBe("campo-1");
        expect(document.activeElement).toBe(focused);
    });

    it("prefere o primeiro erro quando há mais de um", () => {
        const root = mount([0, 1]);

        expect((focusFirstError(root) as HTMLInputElement)?.name).toBe("campo-0");
    });

    it("rola até o campo dono, centralizado", () => {
        const root = mount([1]);

        focusFirstError(root);

        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
        expect(scrollIntoView.mock.instances[0]).toBe(root.querySelectorAll(".RField")[1]);
    });

    it("devolve undefined e não toca em nada sem nenhum erro na tela", () => {
        const root = mount([]);

        expect(focusFirstError(root)).toBeUndefined();
        expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("rola um campo sem focável mesmo assim", () => {
        const root = mount([1], [true, false]);

        expect(focusFirstError(root)).toBeUndefined();
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it("não lança sem DOM", () => {
        expect(focusFirstError(undefined)).toBeUndefined();
        expect(focusFirstError({} as HTMLElement)).toBeUndefined();
    });
});