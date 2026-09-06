<template>
    <RForm
        v-model="data"
        class="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
        <RDynamic :schema />
    </RForm>
</template>

<script setup lang="ts">
    import { z } from "zod";

    const ufs = ["SP", "RJ", "MG", "BA", "RS"].map((uf) => ({ id: uf, name: uf }));

    const { data, schema } = useRForm({
        empresa: {
            type: "text",
            label: "demo.dynamic.razaoSocial",
            placeholder: "demo.dynamic.razaoSocialExemplo",
            rule: z.string().min(2)
        },
        cnpj: {
            type: "text",
            label: "~~CNPJ",
            mask: "brCnpj",
            rule: "brCnpj"
        },
        abertura: {
            type: "date",
            label: "demo.dynamic.abertura"
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
                cidade: {
                    type: "text",
                    label: "demo.object.cidade"
                },
                uf: {
                    type: "select",
                    label: "demo.select.uf",
                    placeholder: "demo.common.selecione",
                    options: ufs
                }
            }
        }
    });
</script>