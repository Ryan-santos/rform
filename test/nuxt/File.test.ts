import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref, type Ref } from "vue";

import { RFile, RForm } from "#components";
import type { Uploaded, UploadContext } from "#rform/types";

import { choose as pick, png } from "../support/files";

type Obj = Record<string, unknown>;

// O RForm muta o objeto ligado no lugar, mas o substitui no reset — o harness segue
// o emit para continuar lendo o model vivo, como no structure.test.
const harness = (props: Obj) => {
    const model = ref<Obj>({});

    const Host = defineComponent({
        setup: () => () =>
            h(
                RForm,
                {
                    modelValue: model.value,
                    "onUpdate:modelValue": (value: Obj) => {
                        model.value = value;
                    }
                } as never,
                { default: () => h(RFile, { name: "anexo", ...props } as never) }
            )
    });

    return { model, Host };
};

const flush = async () => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();
};

const choose = async (
    wrapper: { find: (selector: string) => { element: Element } },
    ...files: File[]
) => {
    pick(wrapper, ...files);
    await flush();
};

const mount = async (props: Obj) => {
    const { model, Host } = harness(props);
    const wrapper = await mountSuspended(Host);
    await flush();

    return { model, wrapper };
};

const done = (id: number, name = "foto.png"): Uploaded => ({
    id,
    name,
    url: `/uploads/${id}`
});

describe("RFile", () => {
    it("liga o modo múltiplo na forma curta `<RFile multiple>`", async () => {
        // A regressão que este teste existe para pegar: sem o `& boolean` o SFC
        // compila `multiple: {}`, a prop chega `""` e só `:multiple="true"` funciona.
        const { model, wrapper } = await mount({ multiple: "" });

        expect(wrapper.find('input[type="file"]').attributes("multiple")).toBeDefined();

        await choose(wrapper, png("a.png"), png("b.png"));

        expect(model.value.anexo).toHaveLength(2);
    });

    it("sem `upload`, o model guarda o próprio File", async () => {
        const { model, wrapper } = await mount({ accept: "png" });

        await choose(wrapper, png("contrato.png"));

        expect(model.value.anexo).toBeInstanceOf(File);
        expect((model.value.anexo as File).name).toBe("contrato.png");
    });

    it("com `upload`, o model guarda o que a função devolveu", async () => {
        const upload = vi.fn(async () => done(7));
        const { model, wrapper } = await mount({ upload });

        await choose(wrapper, png());

        expect(upload).toHaveBeenCalledOnce();
        expect(model.value.anexo).toEqual(done(7));

        // A entry saiu da fila: o que a lista mostra agora é o item do model.
        expect(wrapper.findAll(".RUtilsFileItem")).toHaveLength(1);
    });

    it("relata o progresso na barra enquanto o upload está em voo", async () => {
        let report: ((ratio: number) => void) | undefined;

        const upload = (_file: File, context: UploadContext) => {
            report = context.onProgress;
            return new Promise<Uploaded>(() => {});
        };

        const { wrapper } = await mount({ upload });

        await choose(wrapper, png());

        report?.(0.4);
        await flush();

        expect(wrapper.html()).toContain("width: 40%");
    });

    it("cancelar aborta o signal e não deixa o POST voltar ao model", async () => {
        let signal: AbortSignal | undefined;
        let settle: ((value: Uploaded) => void) | undefined;

        const upload = (_file: File, context: UploadContext) => {
            signal = context.signal;
            return new Promise<Uploaded>((resolve) => {
                settle = resolve;
            });
        };

        const { model, wrapper } = await mount({ upload });

        await choose(wrapper, png());

        // O botão de cancelar é o único da linha enquanto ela está pendente.
        await wrapper.find(".RUtilsFileItem button").trigger("click");
        await flush();

        expect(signal?.aborted).toBe(true);

        settle?.(done(1));
        await flush();

        expect(model.value.anexo ?? null).toBeNull();
        expect(wrapper.findAll(".RUtilsFileItem")).toHaveLength(0);
    });

    it("falhar deixa a linha em erro, e o retry sobe de novo", async () => {
        const upload = vi
            .fn<(file: File, context: UploadContext) => Promise<Uploaded>>()
            .mockRejectedValueOnce(new Error("502 do servidor"))
            .mockResolvedValueOnce(done(3));

        const { model, wrapper } = await mount({ upload });

        await choose(wrapper, png());

        expect(wrapper.text()).toContain("502 do servidor");

        await wrapper.find(".RUtilsFileItem button").trigger("click");
        await flush();

        expect(upload).toHaveBeenCalledTimes(2);
        expect(model.value.anexo).toEqual(done(3));
    });

    it("remover tira o item do model e chama o `remove` do app", async () => {
        const remove = vi.fn(async () => {});
        const upload = async () => done(9);

        const { model, wrapper } = await mount({ upload, remove });

        await choose(wrapper, png());
        expect(model.value.anexo).toEqual(done(9));

        await wrapper.find(".RUtilsFileItem button").trigger("click");
        await flush();

        expect(remove).toHaveBeenCalledWith(done(9));
        expect(model.value.anexo ?? null).toBeNull();
    });

    it("um `remove` que falha mantém o item e diz o porquê na linha", async () => {
        const remove = vi.fn(async () => {
            throw new Error("403 do servidor");
        });

        const { model, wrapper } = await mount({ upload: async () => done(4), remove });

        await choose(wrapper, png());
        await wrapper.find(".RUtilsFileItem button").trigger("click");
        await flush();

        expect(model.value.anexo).toEqual(done(4));
        expect(wrapper.text()).toContain("403 do servidor");
    });

    it("recusa por `accept` sem tocar no model, com a mensagem na linha", async () => {
        const { model, wrapper } = await mount({ accept: "image/*" });

        const pdf = new File(["x"], "contrato.pdf", { type: "application/pdf" });

        await choose(wrapper, pdf);

        expect(model.value.anexo ?? null).toBeNull();
        expect(wrapper.text()).toContain("Formato não aceito.");
    });

    it("recusa por `maxSize` antes de subir, dizendo o limite", async () => {
        const upload = vi.fn(async () => done(1));
        const { model, wrapper } = await mount({ upload, maxSize: 1024 });

        await choose(wrapper, png("grande.png", 4096));

        expect(upload).not.toHaveBeenCalled();
        expect(model.value.anexo ?? null).toBeNull();
        expect(wrapper.text()).toContain("Arquivo maior que 1 KB.");
    });

    it("recusa o que passa do `maxFiles`, e pluraliza o limite", async () => {
        const { model, wrapper } = await mount({ multiple: "", maxFiles: 2 });

        await choose(wrapper, png("a.png"), png("b.png"), png("c.png"));

        expect(model.value.anexo).toHaveLength(2);
        expect(wrapper.text()).toContain("Máximo de 2 arquivos.");
    });

    it("normaliza o model para lista no modo múltiplo, mesmo antes do primeiro arquivo", async () => {
        const { wrapper } = await mount({ multiple: "" });

        // Nada de linha nenhuma: o `null` do seed não pode virar uma entrada fantasma.
        expect(wrapper.findAll(".RUtilsFileItem")).toHaveLength(0);

        await choose(wrapper, png("a.png"));
        await choose(wrapper, png("b.png"));

        expect(wrapper.findAll(".RUtilsFileItem")).toHaveLength(2);
    });

    it("`accept` normalizado chega ao input nativo, que não entende `png` cru", async () => {
        const { wrapper } = await mount({ accept: "png, jpg" });

        expect(wrapper.find('input[type="file"]').attributes("accept")).toBe(".png,.jpg");
    });

    it("`loading` do call site acende o overlay, e não só o estado interno", async () => {
        const { wrapper } = await mount({ loading: true });

        const overlay = wrapper.find(".RField .backdrop-blur-sm");

        expect(overlay.exists()).toBe(true);
        expect(overlay.attributes("style") ?? "").not.toContain("display: none");
    });

    it("a miniatura sobrevive ao upload, com a `url` que não tem extensão", async () => {
        // O happy-dom recusa o `File` no `createObjectURL` — o stub é o que deixa o
        // caminho da miniatura local ser observável.
        const objectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");

        try {
            const upload = async () => ({ id: 1, name: "foto.png", url: "/uploads/1" });
            const { wrapper } = await mount({ upload });

            await choose(wrapper, png());

            expect(wrapper.find(".RUtilsFileItem img").attributes("src")).toBe("blob:preview");
        } finally {
            objectUrl.mockRestore();
        }
    });

    it("o `type` do Uploaded faz a `url` valer de miniatura, sem `File` por perto", async () => {
        const { wrapper } = await mount({
            default: { id: 9, name: "foto", url: "/uploads/9", type: "image/png" }
        });

        expect(wrapper.find(".RUtilsFileItem img").attributes("src")).toBe("/uploads/9");
    });

    it("o `size` do Uploaded aparece na linha", async () => {
        const upload = async () => ({ id: 2, name: "foto.png", url: "/uploads/2", size: 2048 });
        const { wrapper } = await mount({ upload });

        await choose(wrapper, png());

        expect(wrapper.text()).toContain("2 KB");
    });

    it("`upload: false` recusa o padrão do defaults.ts e o model volta ao File", async () => {
        // O `merger` não deixa um valor falsy apagar um default, então a recusa é lida
        // da prop crua — sem isso não haveria como um campo escapar do padrão do app.
        const { model, wrapper } = await mount({ upload: false });

        await choose(wrapper, png("contrato.png"));

        expect(model.value.anexo).toBeInstanceOf(File);
    });

    it("`disabled` tranca a dropzone e as ações da lista", async () => {
        const { model, wrapper } = await mount({
            disabled: true,
            default: { id: 3, name: "foto", url: "/uploads/3" }
        });

        expect(wrapper.find('input[type="file"]').attributes("disabled")).toBeDefined();
        expect(wrapper.find(".RField label").classes()).toContain("pointer-events-none");
        expect(wrapper.find(".RUtilsFileItem button").attributes("disabled")).toBeDefined();

        await choose(wrapper, png("nova.png"));

        expect((model.value.anexo as { id: number }).id).toBe(3);
    });

    it("dois campos na mesma página não pulsam juntos no drag", async () => {
        const model: Ref<Obj> = ref({});

        const Host = defineComponent({
            setup: () => () =>
                h(RForm, { modelValue: model.value } as never, {
                    default: () => [
                        h(RFile, { name: "um" } as never),
                        h(RFile, { name: "dois" } as never)
                    ]
                })
        });

        const wrapper = await mountSuspended(Host);
        await flush();

        const zones = wrapper.findAll(".RField label");

        await zones[0]!.trigger("dragenter");
        await flush();

        // Contra o array, e não contra a string junta: `hover:border-…` já está na
        // classe base das duas, e casaria por substring nas duas.
        expect(zones[0]!.classes()).toContain("border-(--rf-color-primary)");
        expect(zones[1]!.classes()).not.toContain("border-(--rf-color-primary)");
    });
});