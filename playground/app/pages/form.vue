<template>
    <DemoPage
        title="Form"
        tag="RForm"
        :source
        :form="false"
        description="O mesmo cadastro de cliente PF montado nos três modos do useRForm. Troque de aba: o formulário na tela é o mesmo, o que muda é de onde vêm a UI, os tipos e a validação."
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
            description="useRForm(schema) devolve data, rules e schema. O RForm recebe o schema e monta o formulário sozinho — não há uma única tag de campo escrita à mão aqui."
        >
            <RForm
                v-model="schemaData"
                :schema="schemaFields"
                :on-submit="submit"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <DemoActions />
            </RForm>
        </Demo>

        <Demo
            v-if="mode === 'zod'"
            id="modo-zod"
            script="modo-zod"
            title="Modo 2 — só zod (sem UI gerada)"
            description="useRForm recebe um objeto só de ZodType, então devolve data e rules — e nada de schema. A UI é sua; o rules agregado valida o objeto inteiro no submit."
        >
            <RForm
                v-model="zodData"
                :on-submit="submit"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <RText
                    name="nome"
                    label="form.nome"
                    placeholder="form.nomeCompleto"
                    required
                />
                <RText
                    name="cpf"
                    label="form.cpf"
                    mask="brCpf"
                    required
                />
                <RText
                    name="email"
                    label="form.email"
                    placeholder="form.emailExemplo"
                />
                <RText
                    name="telefone"
                    label="form.telefone"
                    mask="brTelefone"
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
                        name="rua"
                        label="form.rua"
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
            description="useRForm<T>() não recebe nada em runtime: só tipa o data. Sem rules e sem schema — quem valida são os presets declarados em cada campo, e o painel ao lado mostra que safeParse não existe neste modo."
        >
            <RForm
                v-model="tsData"
                :on-submit="submit"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <RText
                    name="nome"
                    label="form.nome"
                    placeholder="form.nomeCompleto"
                    required
                    rule="required"
                />
                <RText
                    name="cpf"
                    label="form.cpf"
                    mask="brCpf"
                    required
                    rule="brCpf"
                />
                <RText
                    name="email"
                    label="form.email"
                    placeholder="form.emailExemplo"
                    rule="email"
                />
                <RText
                    name="telefone"
                    label="form.telefone"
                    mask="brTelefone"
                    rule="brTelefone"
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
                        name="rua"
                        label="form.rua"
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

    import source from "./form.vue?raw";

    const mode = ref("schema");

    const modes = [
        {
            id: "schema",
            label: "1 · schema completo",
            description: "O schema é o dado: ele descreve os campos, e o RForm os renderiza."
        },
        {
            id: "zod",
            label: "2 · só zod",
            description:
                "Sem UI gerada. Tipos e validação vêm do zod; o formulário é escrito à mão."
        },
        {
            id: "ts",
            label: "3 · só TS",
            description:
                "Nada em runtime. Só o tipo do data; a validação fica nos presets de cada campo."
        }
    ];

    const ufs = ["SP", "RJ", "MG", "BA", "RS"].map((uf) => ({ id: uf, name: uf }));

    // #region modo-schema
    const {
        data: schemaData,
        rules: schemaRules,
        schema: schemaFields
    } = useRForm({
        nome: {
            type: "text",
            label: "form.nome",
            placeholder: "form.nomeCompleto",
            rule: z.string().min(2, "mínimo 2 caracteres")
        },
        cpf: {
            type: "text",
            label: "form.cpf",
            mask: "brCpf",
            rule: "brCpf"
        },
        email: {
            type: "text",
            label: "form.email",
            placeholder: "form.emailExemplo",
            rule: "email"
        },
        telefone: {
            type: "text",
            label: "form.telefone",
            mask: "brTelefone",
            rule: "brTelefone"
        },
        nascimento: {
            type: "date",
            label: "form.nascimento"
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
                rua: {
                    type: "text",
                    label: "form.rua"
                },
                numero: {
                    type: "number",
                    label: "form.numero"
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
        aceite: {
            type: "switch",
            placeholder: "form.aceiteTermos",
            rule: z.literal(true, "É preciso aceitar os termos.")
        }
    });
    // #endregion

    // #region modo-zod
    const { data: zodData, rules: zodRules } = useRForm({
        nome: z.string().min(2, "mínimo 2 caracteres"),
        cpf: z.string().min(14, "CPF incompleto"),
        email: z.email("e-mail inválido"),
        telefone: z.string().optional(),
        endereco: z.object({
            cep: z.string().min(9, "CEP incompleto"),
            rua: z.string().min(3, "informe a rua")
        })
    });
    // #endregion

    // #region modo-ts
    type Cadastro = {
        nome?: string;
        cpf?: string;
        email?: string;
        telefone?: string;
        endereco?: {
            cep?: string;
            rua?: string;
        };
    };

    const { data: tsData } = useRForm<Cadastro>();
    // #endregion

    const parses = ref<Record<string, unknown>>({});

    const active = computed(() => {
        const table = {
            schema: { data: schemaData.value, rules: schemaRules },
            zod: { data: zodData.value, rules: zodRules },
            ts: { data: tsData.value, rules: undefined }
        } as const;

        const current = table[mode.value as keyof typeof table];

        return {
            data: current.data,
            rules: current.rules,
            parse:
                parses.value[mode.value] ??
                (current.rules ? "clique em submit" : "este modo não devolve rules")
        };
    });

    /**
     * `safeParseAsync`, not `safeParse`: a rule referenced by preset name becomes
     * `z.any().superRefine(async …)` in the aggregated object, and a sync parse
     * would throw on it.
     */
    const submit = async () => {
        const { rules, data } = active.value;

        parses.value = {
            ...parses.value,
            [mode.value]: rules ? await rules.safeParseAsync(data) : "este modo não devolve rules"
        };
    };
</script>