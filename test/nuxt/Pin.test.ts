import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { h, nextTick, ref } from "vue";

import { RPin } from "#components";

const mountPin = async (props: Record<string, unknown> = {}) => {
    const model = ref<string>((props.modelValue as string) ?? "");

    const wrapper = await mountSuspended(
        {
            setup: () => () =>
                h(RPin, {
                    ...props,
                    modelValue: model.value,
                    "onUpdate:modelValue": (value: string) => {
                        model.value = value;
                    }
                })
        },
        { attachTo: document.body }
    );

    return {
        wrapper,
        model,
        boxes: () => wrapper.findAll("input")
    };
};

describe("RPin", () => {
    it("renderiza seis células por padrão", async () => {
        const wrapper = await mountSuspended(RPin);
        expect(wrapper.findAll("input")).toHaveLength(6);
    });

    it("renderiza o número de células que length pede", async () => {
        const { boxes } = await mountPin({ length: 4 });
        expect(boxes()).toHaveLength(4);
    });

    it("espalha o model pelas células", async () => {
        const { boxes } = await mountPin({ modelValue: "123" });

        expect(boxes().map((box) => box.element.value)).toEqual(["1", "2", "3", "", "", ""]);
    });

    it("escreve no model o caractere digitado", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.setValue("7");

        expect(model.value).toBe("7");
    });

    it("move o foco para a célula seguinte depois de digitar", async () => {
        const { boxes } = await mountPin();

        await boxes()[0]!.setValue("7");

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });
});

describe("RPin, conjunto de caracteres", () => {
    it("marca célula numérica com inputmode numérico", async () => {
        const { boxes } = await mountPin();
        expect(boxes()[0]!.attributes("inputmode")).toBe("numeric");
    });

    it("ignora uma letra quando o tipo é numérico", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.setValue("a");

        expect(model.value).toBe("");
    });

    it("mantém o foco na célula quando o caractere é recusado", async () => {
        const { boxes } = await mountPin();

        boxes()[0]!.element.focus();
        await boxes()[0]!.setValue("a");

        expect(document.activeElement).toBe(boxes()[0]!.element);
    });

    it("põe as letras em maiúscula quando o tipo é alfanumérico", async () => {
        const { boxes, model } = await mountPin({ type: "alphanumeric" });

        await boxes()[0]!.setValue("a");

        expect(model.value).toBe("A");
    });

    it("ignora pontuação quando o tipo é alfanumérico", async () => {
        const { boxes, model } = await mountPin({ type: "alphanumeric" });

        await boxes()[0]!.setValue("-");

        expect(model.value).toBe("");
    });

    it("marca célula alfanumérica com inputmode de texto", async () => {
        const { boxes } = await mountPin({ type: "alphanumeric" });
        expect(boxes()[0]!.attributes("inputmode")).toBe("text");
    });
});

describe("RPin, teclado", () => {
    it("remove o caractere da célula focada no backspace", async () => {
        const { boxes, model } = await mountPin({ modelValue: "12" });

        await boxes()[1]!.trigger("keydown", { key: "Backspace" });

        expect(model.value).toBe("1");
    });

    it("mantém o foco no lugar ao apagar uma célula preenchida", async () => {
        const { boxes } = await mountPin({ modelValue: "12" });

        boxes()[1]!.element.focus();
        await boxes()[1]!.trigger("keydown", { key: "Backspace" });

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });

    it("limpa a célula anterior ao apagar numa vazia", async () => {
        const { boxes, model } = await mountPin({ modelValue: "12" });

        await boxes()[2]!.trigger("keydown", { key: "Backspace" });

        expect(model.value).toBe("1");
    });

    it("volta o foco ao apagar numa célula vazia", async () => {
        const { boxes } = await mountPin({ modelValue: "12" });

        await boxes()[2]!.trigger("keydown", { key: "Backspace" });

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });

    it("move o foco com a seta esquerda", async () => {
        const { boxes } = await mountPin({ modelValue: "123" });

        await boxes()[2]!.trigger("keydown", { key: "ArrowLeft" });

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });

    it("move o foco com a seta direita", async () => {
        const { boxes } = await mountPin({ modelValue: "123" });

        await boxes()[0]!.trigger("keydown", { key: "ArrowRight" });

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });

    it("redireciona o foco para a primeira célula vazia, para o valor nunca ter buraco", async () => {
        const { boxes } = await mountPin({ modelValue: "12" });

        boxes()[4]!.element.focus();
        await nextTick();

        expect(document.activeElement).toBe(boxes()[2]!.element);
    });

    it("deixa o foco em paz numa célula dentro do valor", async () => {
        const { boxes } = await mountPin({ modelValue: "123" });

        boxes()[1]!.element.focus();
        await nextTick();

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });
});

describe("RPin, colar", () => {
    it("mantém os dois caracteres quando dois são digitados no mesmo tick", async () => {
        const { boxes, model } = await mountPin();

        void boxes()[0]!.setValue("1");
        void boxes()[1]!.setValue("2");
        await nextTick();

        expect(model.value).toBe("12");
    });

    it("distribui um código colado pelas células", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.trigger("paste", {
            clipboardData: { getData: () => "123456" }
        });

        expect(model.value).toBe("123456");
    });

    it("descarta caractere colado fora do conjunto", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.trigger("paste", {
            clipboardData: { getData: () => "12ab34" }
        });

        expect(model.value).toBe("1234");
    });

    it("corta o valor colado no length", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.trigger("paste", {
            clipboardData: { getData: () => "1234567890" }
        });

        expect(model.value).toBe("123456");
    });

    it("foca a célula seguinte ao valor colado", async () => {
        const { boxes } = await mountPin();

        await boxes()[0]!.trigger("paste", {
            clipboardData: { getData: () => "123" }
        });

        expect(document.activeElement).toBe(boxes()[3]!.element);
    });
});

describe("RPin, secreto", () => {
    it("renderiza células comuns por padrão", async () => {
        const { boxes } = await mountPin();
        expect(boxes()[0]!.attributes("type")).toBe("text");
    });

    it("renderiza células de senha quando secret", async () => {
        const { boxes } = await mountPin({ secret: true });
        expect(boxes()[0]!.attributes("type")).toBe("password");
    });
});

describe("RPin, autofoco", () => {
    it("não rouba o foco por padrão", async () => {
        const { boxes } = await mountPin();
        expect(document.activeElement).not.toBe(boxes()[0]!.element);
    });

    it("foca a primeira célula na montagem", async () => {
        const { boxes } = await mountPin({ autofocus: true });
        expect(document.activeElement).toBe(boxes()[0]!.element);
    });

    it("foca a primeira célula vazia na montagem", async () => {
        const { boxes } = await mountPin({ autofocus: true, modelValue: "12" });
        expect(document.activeElement).toBe(boxes()[2]!.element);
    });
});

describe("RPin, separador", () => {
    it("não renderiza separador por padrão", async () => {
        const { wrapper } = await mountPin();
        expect(wrapper.findAll("[aria-hidden='true']")).toHaveLength(0);
    });

    it("renderiza um separador a cada N células", async () => {
        const { wrapper } = await mountPin({ separator: 2 });
        expect(wrapper.findAll("[aria-hidden='true']")).toHaveLength(2);
    });

    it("não renderiza separador depois da última célula", async () => {
        const { wrapper } = await mountPin({ length: 6, separator: 3 });
        expect(wrapper.findAll("[aria-hidden='true']")).toHaveLength(1);
    });
});

describe("RPin, conclusão", () => {
    it("chama onComplete com o valor completo", async () => {
        const onComplete = vi.fn();
        const { boxes } = await mountPin({ length: 3, onComplete });

        await boxes()[0]!.trigger("paste", { clipboardData: { getData: () => "123" } });

        expect(onComplete).toHaveBeenCalledWith("123");
    });

    it("não chama onComplete enquanto o valor está incompleto", async () => {
        const onComplete = vi.fn();
        const { boxes } = await mountPin({ length: 3, onComplete });

        await boxes()[0]!.trigger("paste", { clipboardData: { getData: () => "12" } });

        expect(onComplete).not.toHaveBeenCalled();
    });

    it("não chama onComplete de novo enquanto o valor continua completo", async () => {
        const onComplete = vi.fn();
        const { boxes } = await mountPin({ length: 3, onComplete });

        await boxes()[0]!.trigger("paste", { clipboardData: { getData: () => "123" } });
        await boxes()[0]!.setValue("9");

        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});
/**
 * O autofill de OTP — o `autocomplete="one-time-code"` da primeira caixa — entrega
 * o código inteiro num evento `input`, nunca num `paste`. Sem distribuir aqui, o
 * `slice(-1)` de antes guardava só o último dígito e perdia os outros, calado.
 */
describe("RPin, autofill de one-time-code", () => {
    it("espalha pelas células o código inteiro que chega num input só", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.setValue("123456");

        expect(model.value).toBe("123456");
        expect(boxes().map((box) => box.element.value)).toEqual(["1", "2", "3", "4", "5", "6"]);
    });

    it("descarta o que não é do charset ao espalhar", async () => {
        const { boxes, model } = await mountPin({ length: 4 });

        await boxes()[0]!.setValue("12-34");

        expect(model.value).toBe("1234");
    });

    it("continua tomando só o caractere novo quando se digita numa célula cheia", async () => {
        const { boxes, model } = await mountPin({ modelValue: "1" });

        await boxes()[0]!.setValue("12");

        expect(model.value).toBe("2");
    });
});