<template>
    <RForm
        v-model="data"
        class="grid grid-cols-1 gap-4 @md:grid-cols-2"
    >
        <RDynamic :schema>
            <template #socios="{ fieldName, rule }">
                <RArray
                    v-slot="{ index }"
                    :name="fieldName"
                    label="demo.array.socios"
                    class="@md:col-span-2"
                    :rule="rule as Rule<'array'>"
                >
                    <RObject :name="index">
                        <RText
                            name="nome"
                            label="demo.common.nome"
                        />
                        <RText
                            name="cpf"
                            label="~~CPF"
                            mask="brCpf"
                            rule="brCpf"
                        />
                    </RObject>
                </RArray>
            </template>
        </RDynamic>
    </RForm>
</template>

<script setup lang="ts">
    import { z } from "zod";

    import type { Rule } from "#rform/types/presets";

    const { data, schema } = useRForm({
        empresa: {
            type: "text",
            label: "demo.dynamic.razaoSocial"
        },
        // Sem `type`, com `slot`: o RDynamic devolve o controle para o template.
        socios: {
            slot: "socios",
            rule: z.array(z.unknown()).min(1)
        }
    });

    // O painel de model do `<Demo>` lê daqui: este exemplo monta o próprio `RForm`.
    defineExpose({ data });
</script>