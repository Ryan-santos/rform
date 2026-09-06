<template>
    <div class="flex flex-col gap-6">
        <Card title="schema">
            <div class="flex w-fit flex-row gap-1 rounded-xl bg-background-100 p-1">
                <button
                    v-for="option in ['pj', 'pf']"
                    :key="option"
                    type="button"
                    class="cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors"
                    :class="
                        tipo === option
                            ? 'bg-primary text-white'
                            : 'text-contrast/60 hover:text-primary'
                    "
                    @click="tipo = option"
                >
                    {{ option }}
                </button>
            </div>
        </Card>

        <Scenario
            title="RDynamic, com slot no lugar de um type"
            :value="data"
        >
            <RForm
                v-model="data"
                :on-submit="submit"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <RDynamic :schema="api.schema">
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

                <button
                    type="submit"
                    class="w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white md:col-span-2"
                >
                    {{ $t("form.enviar") }}
                </button>
            </RForm>
        </Scenario>

        <Card title="rules.safeParseAsync(data)">
            <Json :value="parse" />
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";
    import { z } from "zod";

    import type { Rule } from "#rform/types/presets";

    const tipo = ref("pj");

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
        }
    });

    const api = computed(() => (tipo.value === "pj" ? pj : pf));

    // Dois `useRForm`, um vivo: o schema é um valor simples, então trocar qual deles
    // o `RDynamic` recebe já troca o formulário.
    const data = computed({
        get: () => api.value.data.value as Record<string, unknown>,
        set: (value) => {
            api.value.data.value = value as never;
        }
    });

    const parse = ref<unknown>("clique em submit");

    // `safeParseAsync`, e não `safeParse`: rule referenciada por nome de preset vira
    // `z.any().superRefine(async …)` no objeto agregado, e um parse síncrono lançaria.
    const submit = async () => {
        parse.value = await api.value.rules.safeParseAsync(data.value);
    };
</script>