<template>
    <RForm
        v-model="data"
        :schema
        @submit="submit"
        class="grid grid-cols-1 gap-4 @md:grid-cols-2"
    >
        <DemoActions />
    </RForm>

    <DemoJson
        :value="parse"
        title="rules.safeParseAsync(data)"
    />
</template>

<script setup lang="ts">
    import { ref } from "vue";
    import { z } from "zod";

    const ufs = ["SP", "RJ", "MG", "BA", "RS"].map((uf) => ({ id: uf, name: uf }));

    const { data, rules, schema } = useRForm({
        nome: {
            type: "text",
            label: "demo.common.nome",
            placeholder: "demo.common.nomeCompleto",
            rule: z.string().min(2)
        },
        cpf: {
            type: "text",
            label: "~~CPF",
            mask: "brCpf",
            rule: "brCpf"
        },
        email: {
            type: "text",
            label: "~~e-mail",
            rule: "email"
        },
        nascimento: {
            type: "date",
            label: "demo.form.nascimento"
        },
        endereco: {
            type: "object",
            label: "demo.object.endereco",
            children: {
                cep: {
                    type: "text",
                    label: "~~CEP",
                    mask: "brCep",
                    rule: "brCep"
                },
                rua: {
                    type: "text",
                    label: "demo.object.rua"
                },
                numero: {
                    type: "number",
                    label: "demo.object.numero"
                },
                // Em schema o `options` só aceita array de objetos: o generic `Opts`
                // do RSelect cai no default `OptArrayObj` quando o tipo vem de
                // `Components["Select"]`. As chaves são as do defaults — `id` e `name`.
                uf: {
                    type: "select",
                    label: "demo.select.uf",
                    placeholder: "demo.common.selecione",
                    options: ufs
                }
            }
        },
        aceite: {
            type: "switch",
            placeholder: "demo.form.aceiteTermos",
            rule: z.literal(true)
        }
    });

    const parse = ref<unknown>("—");

    // `safeParseAsync`, e não `safeParse`: rule referenciada por nome de preset vira
    // `z.any().superRefine(async …)` no objeto agregado, e um parse síncrono lançaria.
    const submit = async () => {
        parse.value = await rules.safeParseAsync(data.value);
    };

    // O painel de model do `<Demo>` lê daqui: este exemplo monta o próprio `RForm`.
    defineExpose({ data });
</script>