// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h, nextTick, ref, type Ref } from "vue";
import { z } from "zod";
import { RArray, RForm, RNumber, RObject, RText } from "#components";
import useRForm from "../../src/runtime/composables/useRForm";
import type { Schema } from "#rform/types/schema";

type Obj = Record<string, unknown>;

/**
 * RForm mutates the bound object in place for child writes, but replaces it on
 * reset — so the harness has to follow the emit to keep reading the live model.
 */
function harness (initial: Obj, children: () => unknown) {
    const model = ref<Obj>(initial);

    const Host = defineComponent({
        setup: () => () =>
            h(
                RForm,
                {
                    "modelValue": model.value,
                    "onUpdate:modelValue": (v: Obj) => {
                        model.value = v;
                    }
                } as never,
                { default: children }
            )
    });

    return { model, Host };
}

const flush = async () => {
    await nextTick();
    await new Promise(r => setTimeout(r));
    await nextTick();
};

describe("estrutura de saída — modo template", () => {
    const children = () => [
        h(RText, { name: "teste", default: "123" } as never),
        h(RNumber, { name: "idade", default: 18 } as never),
        h(RObject, { name: "obj" } as never, {
            default: () => [h(RText, { name: "inner", default: "abc" } as never)]
        })
    ];

    it("monta a estrutura inicial a partir dos defaults", async () => {
        const { model, Host } = harness({}, children);
        await mountSuspended(Host);
        await flush();

        expect(model.value).toEqual({
            teste: "123",
            idade: 18,
            obj: { inner: "abc" }
        });
    });

    it("é reativo: escrever no input reflete no model", async () => {
        const { model, Host } = harness({}, children);
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("input")[0]!.setValue("456");
        await flush();

        expect(model.value.teste).toBe("456");
    });

    it("reset volta para os defaults", async () => {
        const { model, Host } = harness({}, children);
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("input")[0]!.setValue("456");
        await flush();
        expect(model.value.teste).toBe("456");

        await wrapper.find("form").trigger("reset");
        await flush();

        expect(model.value).toEqual({
            teste: "123",
            idade: 18,
            obj: { inner: "abc" }
        });
    });

    it("definir undefined em um campo restaura o default daquele campo", async () => {
        const { model, Host } = harness({}, children);
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("input")[0]!.setValue("456");
        await flush();

        model.value.teste = undefined;
        await flush();

        expect(model.value.teste).toBe("123");
    });

    it("campo sem default no call site recebe o default do próprio componente", async () => {
        const { model, Host } = harness({}, () => [
            h(RText, { name: "semDefault" } as never)
        ]);
        await mountSuspended(Host);
        await flush();

        expect(model.value).toEqual({ semDefault: "" });
    });

    it("reage à troca externa do objeto ligado ao v-model", async () => {
        const { model, Host } = harness({ teste: "inicial" }, () => [
            h(RText, { name: "teste", default: "123" } as never)
        ]);
        const wrapper = await mountSuspended(Host);
        await flush();

        model.value = { teste: "trocado-de-fora" };
        await flush();

        expect(wrapper.find("input").element.value).toBe("trocado-de-fora");

        await wrapper.find("input").setValue("digitado");
        await flush();

        expect(model.value.teste).toBe("digitado");
    });

    it("não vaza estado entre duas instâncias do mesmo form", async () => {
        const a = harness({}, children);
        const wrapperA = await mountSuspended(a.Host);
        await flush();
        await wrapperA.findAll("input")[0]!.setValue("456");
        await flush();

        const b = harness({}, children);
        await mountSuspended(b.Host);
        await flush();

        expect(b.model.value.teste).toBe("123");
    });
});

describe("estrutura de saída — modo dynamic (schema completo)", () => {
    const build = () =>
        useRForm({
            teste: { type: "text", default: "123", rule: z.string() },
            idade: { type: "number", default: 18, rule: z.number() },
            obj: {
                type: "object",
                children: {
                    inner: { type: "text", default: "abc", rule: z.string() }
                }
            }
        } as unknown as Schema);

    function dynHarness () {
        const form = build();
        const model = form.data as Ref<Obj>;

        const Host = defineComponent({
            setup: () => () =>
                h(RForm, {
                    "schema": form.schema,
                    "modelValue": model.value,
                    "onUpdate:modelValue": (v: Obj) => {
                        model.value = v;
                    }
                } as never)
        });

        return { form, model, Host };
    }

    it("monta a estrutura inicial a partir dos defaults do schema", async () => {
        const { model, Host } = dynHarness();
        await mountSuspended(Host);
        await flush();

        expect(model.value).toEqual({
            teste: "123",
            idade: 18,
            obj: { inner: "abc" }
        });
    });

    it("é reativo", async () => {
        const { model, Host } = dynHarness();
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("input")[0]!.setValue("456");
        await flush();

        expect(model.value.teste).toBe("456");
    });

    it("reset volta para os defaults", async () => {
        const { model, Host } = dynHarness();
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("input")[0]!.setValue("456");
        await flush();

        await wrapper.find("form").trigger("reset");
        await flush();

        expect(model.value).toEqual({
            teste: "123",
            idade: 18,
            obj: { inner: "abc" }
        });
    });

    it("a estrutura casa com rules.safeParseAsync", async () => {
        const { form, model, Host } = dynHarness();
        await mountSuspended(Host);
        await flush();

        const parsed = await form.rules.safeParseAsync(model.value);
        expect(parsed.success).toBe(true);
    });
});

describe("estrutura de saída — modo só zod", () => {
    function zodHarness () {
        const form = useRForm({
            teste: z.string(),
            idade: z.number()
        });
        const model = form.data as unknown as Ref<Obj>;

        const Host = defineComponent({
            setup: () => () =>
                h(
                    RForm,
                    {
                        "modelValue": model.value,
                        "onUpdate:modelValue": (v: Obj) => {
                            model.value = v;
                        }
                    } as never,
                    {
                        default: () => [
                            h(RText, { name: "teste", default: "123" } as never),
                            h(RNumber, { name: "idade", default: 18 } as never)
                        ]
                    }
                )
        });

        return { form, model, Host };
    }

    it("data começa vazio e é preenchido pelos campos montados", async () => {
        const { model, Host } = zodHarness();
        await mountSuspended(Host);
        await flush();

        expect(model.value).toEqual({ teste: "123", idade: 18 });
    });

    it("é reativo e o resultado passa no zod", async () => {
        const { form, model, Host } = zodHarness();
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("input")[0]!.setValue("456");
        await flush();

        expect(model.value.teste).toBe("456");
        expect(form.rules.safeParse(model.value).success).toBe(true);
    });

    it("reset volta para os defaults", async () => {
        const { model, Host } = zodHarness();
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("input")[0]!.setValue("456");
        await flush();

        await wrapper.find("form").trigger("reset");
        await flush();

        expect(model.value).toEqual({ teste: "123", idade: 18 });
    });
});

describe("estrutura de saída — modo só TS", () => {
    function tsHarness () {
        const form = useRForm<{ teste?: string; idade?: number }>();
        const model = form.data as unknown as Ref<Obj>;

        const Host = defineComponent({
            setup: () => () =>
                h(
                    RForm,
                    {
                        "modelValue": model.value,
                        "onUpdate:modelValue": (v: Obj) => {
                            model.value = v;
                        }
                    } as never,
                    {
                        default: () => [
                            h(RText, { name: "teste", default: "123" } as never),
                            h(RNumber, { name: "idade", default: 18 } as never)
                        ]
                    }
                )
        });

        return { model, Host };
    }

    it("monta a estrutura inicial a partir dos defaults", async () => {
        const { model, Host } = tsHarness();
        await mountSuspended(Host);
        await flush();

        expect(model.value).toEqual({ teste: "123", idade: 18 });
    });

    it("é reativo e reseta", async () => {
        const { model, Host } = tsHarness();
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("input")[0]!.setValue("456");
        await flush();
        expect(model.value.teste).toBe("456");

        await wrapper.find("form").trigger("reset");
        await flush();
        expect(model.value.teste).toBe("123");
    });
});

describe("estrutura de saída — aninhamento profundo", () => {
    const children = () => [
        h(RObject, { name: "a" } as never, {
            default: () => [
                h(RObject, { name: "b" } as never, {
                    default: () => [
                        h(RObject, { name: "c" } as never, {
                            default: () => [
                                h(RText, { name: "leaf", default: "deep" } as never)
                            ]
                        })
                    ]
                })
            ]
        })
    ];

    it("monta objetos aninhados em 3 níveis", async () => {
        const { model, Host } = harness({}, children);
        await mountSuspended(Host);
        await flush();

        expect(model.value).toEqual({ a: { b: { c: { leaf: "deep" } } } });
    });

    it("é reativo no nível mais profundo", async () => {
        const { model, Host } = harness({}, children);
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.find("input").setValue("mudou");
        await flush();

        expect(model.value).toEqual({ a: { b: { c: { leaf: "mudou" } } } });
    });

    it("reset restaura a árvore inteira", async () => {
        const { model, Host } = harness({}, children);
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.find("input").setValue("mudou");
        await flush();

        await wrapper.find("form").trigger("reset");
        await flush();

        expect(model.value).toEqual({ a: { b: { c: { leaf: "deep" } } } });
    });

    it("array de primitivos: remover encurta a lista, sem rebrotar o slot", async () => {
        const { model, Host } = harness({}, () => [
            h(RArray, { name: "users" } as never, {
                default: ({ index }: { index: number }) =>
                    h(RText, { name: index } as never)
            })
        ]);
        const wrapper = await mountSuspended(Host);
        await flush();

        const add = () => wrapper.findAll("button").at(-1)!;
        await add().trigger("click");
        await flush();
        await add().trigger("click");
        await flush();
        await add().trigger("click");
        await flush();

        const inputs = wrapper.findAll("input");
        await inputs[0]!.setValue("um");
        await inputs[1]!.setValue("dois");
        await inputs[2]!.setValue("tres");
        await flush();
        expect(model.value.users).toEqual(["um", "dois", "tres"]);

        const remover = (i: number) => wrapper.findAll('[class*="cursor-pointer"]')[i]!;

        await remover(1).trigger("click");
        await flush();
        expect(model.value.users).toEqual(["um", "tres"]);

        await remover(0).trigger("click");
        await flush();
        expect(model.value.users).toEqual(["tres"]);
        expect(wrapper.findAll("input")).toHaveLength(1);
    });

    it("array volta para o default vazio no reset", async () => {
        const { model, Host } = harness({}, () => [
            h(RArray, { name: "users" } as never, {
                default: ({ index }: { index: number }) =>
                    h(RText, { name: index } as never)
            })
        ]);
        const wrapper = await mountSuspended(Host);
        await flush();

        await wrapper.findAll("button").at(-1)!.trigger("click");
        await flush();
        await wrapper.findAll("input")[0]!.setValue("um");
        await flush();
        expect(model.value.users).toEqual(["um"]);

        await wrapper.find("form").trigger("reset");
        await flush();

        expect(model.value.users).toEqual([]);
        expect(wrapper.findAll("input")).toHaveLength(0);
    });

    it("array de objetos: remover item não deixa resíduo", async () => {
        const { model, Host } = harness({}, () => [
            h(RArray, { name: "lista" } as never, {
                default: ({ index }: { index: number }) =>
                    h(RObject, { name: index } as never, {
                        default: () => [h(RText, { name: "nome" } as never)]
                    })
            })
        ]);
        const wrapper = await mountSuspended(Host);
        await flush();

        const add = () => wrapper.findAll("button").at(-1)!;
        await add().trigger("click");
        await flush();
        await add().trigger("click");
        await flush();

        const inputs = wrapper.findAll("input");
        await inputs[0]!.setValue("a");
        await inputs[1]!.setValue("b");
        await flush();
        expect(model.value.lista).toEqual([{ nome: "a" }, { nome: "b" }]);

        await wrapper.findAll('[class*="cursor-pointer"]')[0]!.trigger("click");
        await flush();

        expect(model.value.lista).toEqual([{ nome: "b" }]);
    });

    it("um form não herda chaves escritas por um form anterior", async () => {
        // Form A remove um item: o RObject órfão fica sem índice e passa a ler
        // pelo fallback do getter. Se esse fallback entregar o `default` do
        // módulo por referência, o RText filho escreve dentro dele e polui o
        // componente para todo o processo.
        const a = harness({}, () => [
            h(RArray, { name: "lista" } as never, {
                default: ({ index }: { index: number }) =>
                    h(RObject, { name: index } as never, {
                        default: () => [h(RText, { name: "nome" } as never)]
                    })
            })
        ]);
        const wrapperA = await mountSuspended(a.Host);
        await flush();

        const addA = () => wrapperA.findAll("button").at(-1)!;
        await addA().trigger("click");
        await flush();
        await addA().trigger("click");
        await flush();
        await wrapperA.findAll('[class*="cursor-pointer"]')[0]!.trigger("click");
        await flush();

        // Form B declara um default no call site: só chega no model se o
        // RObject tiver nascido de um `{}` limpo.
        const b = harness({}, () => [
            h(RArray, { name: "lista" } as never, {
                default: ({ index }: { index: number }) =>
                    h(RObject, { name: index } as never, {
                        default: () => [
                            h(RText, { name: "nome", default: "novo" } as never)
                        ]
                    })
            })
        ]);
        const wrapperB = await mountSuspended(b.Host);
        await flush();

        await wrapperB.findAll("button").at(-1)!.trigger("click");
        await flush();

        expect(b.model.value).toEqual({ lista: [{ nome: "novo" }] });
    });

    it("array de objetos: cada item ganha os defaults do filho", async () => {
        const arrChildren = () => [
            h(RArray, { name: "lista", default: [] } as never, {
                default: ({ index }: { index: number }) =>
                    h(RObject, { name: index } as never, {
                        default: () => [
                            h(RText, { name: "nome", default: "novo" } as never)
                        ]
                    })
            })
        ];

        const { model, Host } = harness({}, arrChildren);
        const wrapper = await mountSuspended(Host);
        await flush();

        expect(model.value).toEqual({ lista: [] });

        await wrapper.find("button").trigger("click");
        await flush();

        expect(model.value).toEqual({ lista: [{ nome: "novo" }] });
    });
});
