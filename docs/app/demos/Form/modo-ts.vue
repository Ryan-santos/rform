<template>
    <RForm
        v-model="data"
        class="grid grid-cols-1 gap-4 @md:grid-cols-2"
    >
        <RText
            name="nome"
            label="demo.common.nome"
            placeholder="demo.common.nomeCompleto"
            required
            rule="required"
        />
        <RText
            name="cpf"
            label="~~CPF"
            mask="brCpf"
            required
            rule="brCpf"
        />
        <RText
            name="email"
            label="~~e-mail"
            rule="email"
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
                rule="brCep"
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
    type Cadastro = {
        nome?: string;
        cpf?: string;
        email?: string;
        endereco?: {
            cep?: string;
            rua?: string;
        };
    };

    // Nada em runtime: `useRForm<T>()` só tipa o `data`. Quem valida são as rules
    // declaradas em cada campo.
    const { data } = useRForm<Cadastro>();

    // O painel de model do `<Demo>` lê daqui: este exemplo monta o próprio `RForm`.
    defineExpose({ data });
</script>