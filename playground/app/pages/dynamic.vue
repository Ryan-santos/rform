<template>
    <DemoPage
        title="Dynamic"
        tag="RDynamic"
        :source
        :form="false"
        description="Onboarding de empresa, com o schema chegando como dado. Os mesmos três modos do useRForm — e aqui fica visível que só o Modo 1 alimenta o RDynamic: sem schema não há o que renderizar."
    >
        <DemoModes
            v-model="mode"
            :modes="modes"
        />

        <Demo
            v-if="mode === 'schema'"
            id="modo-schema"
            script="modo-schema"
            title="Modo 1 — schema completo (renderiza UI)"
            description="O RDynamic percorre o schema e resolve cada type pelo components-map. object e array recursam sozinhos; um campo com slot em vez de type devolve o controle pra você."
        >
            <div class="flex w-fit flex-row gap-1 rounded-xl bg-background-100 p-1">
                <button
                    v-for="option in tipos"
                    :key="option.id"
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-sm transition-colors duration-300"
                    :class="
                        tipo === option.id
                            ? 'bg-primary text-white'
                            : 'text-contrast/60 hover:text-primary'
                    "
                    @click="tipo = option.id"
                >
                    {{ option.label }}
                </button>
            </div>

            <p class="max-w-prose text-sm text-contrast/50">
                Os dois botões trocam o schema, não o template. É o mesmo
                <code class="font-mono">&lt;RDynamic&gt;</code> renderizando formulários diferentes.
            </p>

            <RForm
                v-model="apiData"
                :on-submit="submit"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <RDynamic :schema="apiSchema">
                    <template #socios="{ fieldName, rule }">
                        <RArray
                            v-slot="{ index }"
                            :name="fieldName"
                            label="empresa.socios"
                            class="md:col-span-2"
                            :rule="rule as Rule<'array'>"
                        >
                            <RObject :name="index">
                                <RText
                                    name="nome"
                                    label="form.nome"
                                />
                                <RText
                                    name="cpf"
                                    label="form.cpf"
                                    mask="brCpf"
                                    rule="brCpf"
                                />
                            </RObject>
                        </RArray>
                    </template>
                </RDynamic>

                <DemoActions submit-text="submit (roda rules.safeParseAsync)" />
            </RForm>
        </Demo>

        <Demo
            v-if="mode === 'zod'"
            id="modo-zod"
            script="modo-zod"
            title="Modo 2 — só zod (sem UI gerada)"
            description="Passando só ZodType, o useRForm devolve data e rules — e nenhum schema. Sem schema o RDynamic não tem o que renderizar, então o formulário abaixo é escrito à mão; o zod agregado continua validando o objeto inteiro."
        >
            <RForm
                v-model="zodData"
                :on-submit="submit"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <RText
                    name="empresa"
                    label="empresa.razaoSocial"
                    placeholder="empresa.razaoSocialExemplo"
                    required
                />
                <RText
                    name="cnpj"
                    label="empresa.cnpj"
                    mask="brCnpj"
                    required
                />
                <RObject
                    name="endereco"
                    label="form.endereco"
                    class="md:col-span-2"
                >
                    <RText
                        name="cep"
                        label="form.cep"
                        mask="brCep"
                    />
                    <RText
                        name="cidade"
                        label="empresa.cidade"
                    />
                </RObject>

                <DemoActions submit-text="submit (roda rules.safeParseAsync)" />
            </RForm>
        </Demo>

        <Demo
            v-if="mode === 'ts'"
            id="modo-ts"
            script="modo-ts"
            title="Modo 3 — só TS (sem runtime)"
            description="useRForm<T>() não recebe argumento nenhum: nada de schema, nada de rules, zero custo em runtime. Sobra o tipo do data — e a validação volta a ser responsabilidade de cada campo."
        >
            <RForm
                v-model="tsData"
                :on-submit="submit"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <RText
                    name="empresa"
                    label="empresa.razaoSocial"
                    placeholder="empresa.razaoSocialExemplo"
                    required
                    rule="required"
                />
                <RText
                    name="cnpj"
                    label="empresa.cnpj"
                    mask="brCnpj"
                    required
                    rule="brCnpj"
                />
                <RObject
                    name="endereco"
                    label="form.endereco"
                    class="md:col-span-2"
                >
                    <RText
                        name="cep"
                        label="form.cep"
                        mask="brCep"
                        rule="brCep"
                    />
                    <RText
                        name="cidade"
                        label="empresa.cidade"
                    />
                </RObject>

                <DemoActions submit-text="submit (roda as rules dos campos)" />
            </RForm>
        </Demo>

        <template #output>
            <div class="flex min-h-0 grow flex-col gap-3">
                <DemoJson
                    :value="active.data"
                    title="data"
                    class="min-h-0 flex-1"
                />
                <DemoJson
                    :value="active.parse"
                    :title="active.rules ? 'rules.safeParseAsync(data)' : 'sem rules neste modo'"
                    class="min-h-0 flex-1"
                />
            </div>
        </template>
    </DemoPage>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";
    import { z } from "zod";

    import type { Rule } from "#rform/types/presets";

    import source from "./dynamic.vue?raw";

    const mode = ref("schema");

    const modes = [
        {
            id: "schema",
            label: "1 · schema completo",
            description: "O schema é o dado. O RDynamic o percorre e monta a árvore de campos."
        },
        {
            id: "zod",
            label: "2 · só zod",
            description:
                "Sem UI gerada: o useRForm não devolve schema, então não há o que o RDynamic renderize."
        },
        {
            id: "ts",
            label: "3 · só TS",
            description: "Sem nada em runtime. Só o tipo do data."
        }
    ];

    const tipos = [
        { id: "pj", label: "Pessoa jurídica" },
        { id: "pf", label: "Pessoa física" }
    ];

    const tipo = ref("pj");

    const ufs = ["SP", "RJ", "MG", "BA", "RS"].map((uf) => ({ id: uf, name: uf }));

    // #region modo-schema
    const pj = useRForm({
        empresa: {
            type: "text",
            label: "empresa.razaoSocial",
            placeholder: "empresa.razaoSocialExemplo",
            rule: z.string().min(2, "informe a razão social")
        },
        cnpj: {
            type: "text",
            label: "empresa.cnpj",
            mask: "brCnpj",
            rule: "brCnpj"
        },
        abertura: {
            type: "date",
            label: "empresa.abertura"
        },
        endereco: {
            type: "object",
            label: "form.endereco",
            children: {
                cep: {
                    type: "text",
                    label: "form.cep",
                    mask: "brCep",
                    rule: "brCep"
                },
                cidade: {
                    type: "text",
                    label: "empresa.cidade"
                },
                /**
                 * Em schema o `options` só aceita array de objetos: o generic
                 * `Opts` do RSelect cai no default `OptArrayObj` quando o tipo
                 * vem de `Components["Select"]`. As chaves são as do defaults
                 * do componente — `id` e `name`.
                 */
                uf: {
                    type: "select",
                    label: "form.uf",
                    placeholder: "form.selecione",
                    options: ufs
                }
            }
        },
        socios: {
            slot: "socios",
            rule: z.array(z.unknown()).min(1, "ao menos um sócio")
        }
    });

    const pf = useRForm({
        nome: {
            type: "text",
            label: "form.nome",
            placeholder: "form.nomeCompleto",
            rule: z.string().min(2, "informe o nome")
        },
        cpf: {
            type: "text",
            label: "form.cpf",
            mask: "brCpf",
            rule: "brCpf"
        },
        endereco: {
            type: "object",
            label: "form.endereco",
            children: {
                cep: {
                    type: "text",
                    label: "form.cep",
                    mask: "brCep",
                    rule: "brCep"
                },
                cidade: {
                    type: "text",
                    label: "empresa.cidade"
                }
            }
        }
    });

    const api = computed(() => (tipo.value === "pj" ? pj : pf));

    const apiSchema = computed(() => api.value.schema);
    // #endregion

    /**
     * Two `useRForm` calls, one live: the schema is a plain value, so swapping
     * which one the `RDynamic` receives is all it takes to change the form.
     */
    const apiData = computed({
        get: () => api.value.data.value as Record<string, unknown>,
        set: (value) => {
            api.value.data.value = value as never;
        }
    });

    // #region modo-zod
    const { data: zodData, rules: zodRules } = useRForm({
        empresa: z.string().min(2, "informe a razão social"),
        cnpj: z.string().min(18, "CNPJ incompleto"),
        endereco: z.object({
            cep: z.string().min(9, "CEP incompleto"),
            cidade: z.string().min(2, "informe a cidade")
        })
    });
    // #endregion

    // #region modo-ts
    type Onboarding = {
        empresa?: string;
        cnpj?: string;
        endereco?: {
            cep?: string;
            cidade?: string;
        };
    };

    const { data: tsData } = useRForm<Onboarding>();
    // #endregion

    const parses = ref<Record<string, unknown>>({});

    const active = computed(() => {
        const table = {
            schema: { data: apiData.value, rules: api.value.rules, key: `schema:${tipo.value}` },
            zod: { data: zodData.value, rules: zodRules, key: "zod" },
            ts: { data: tsData.value, rules: undefined, key: "ts" }
        } as const;

        const current = table[mode.value as keyof typeof table];

        return {
            data: current.data,
            rules: current.rules,
            key: current.key,
            parse:
                parses.value[current.key] ??
                (current.rules ? "clique em submit" : "este modo não devolve rules")
        };
    });

    /**
     * `safeParseAsync`, not `safeParse`: a rule referenced by preset name becomes
     * `z.any().superRefine(async …)` in the aggregated object, and a sync parse
     * would throw on it.
     */
    const submit = async () => {
        const { rules, data, key } = active.value;

        parses.value = {
            ...parses.value,
            [key]: rules ? await rules.safeParseAsync(data) : "este modo não devolve rules"
        };
    };
</script>