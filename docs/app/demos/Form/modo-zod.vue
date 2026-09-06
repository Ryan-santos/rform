<template>
    <RForm
        v-model="data"
        :rules
        class="grid grid-cols-1 gap-4 @md:grid-cols-2"
    >
        <RText
            name="nome"
            label="demo.common.nome"
            placeholder="demo.common.nomeCompleto"
            required
        />
        <RText
            name="cpf"
            label="~~CPF"
            mask="brCpf"
            required
        />
        <RText
            name="email"
            label="~~e-mail"
        />
        <RObject
            name="endereco"
            label="demo.object.endereco"
            class="@md:col-span-2"
        >
            <RText
                name="cep"
                label="~~CEP"
                mask="brCep"
            />
            <RText
                name="rua"
                label="demo.object.rua"
            />
        </RObject>

        <DemoActions />
    </RForm>
</template>

<script setup lang="ts">
    import { z } from "zod";

    const { data, rules } = useRForm({
        nome: z.string().min(2),
        cpf: z.string().min(14),
        email: z.email(),
        endereco: z.object({
            cep: z.string().min(9),
            rua: z.string().min(3)
        })
    });

    // O painel de model do `<Demo>` lê daqui: este exemplo monta o próprio `RForm`.
    defineExpose({ data });
</script>