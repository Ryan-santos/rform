<template>
    <RForm
        ref="form"
        v-model="data"
        class="flex flex-col gap-4"
        @submit="enviar"
    >
        <RText
            name="nome"
            label="demo.common.nome"
            placeholder="demo.common.nomeCompleto"
        />
        <RText
            name="email"
            label="~~e-mail"
        />

        <DemoActions :submit-text="$t('demo.form.enviarServidor')" />

        <button
            type="button"
            class="cursor-pointer self-start rounded-lg border border-contrast/10 px-4 py-2 text-sm"
            @click="form?.setErrors({ nome: $t('demo.form.nomeRegistrado') })"
        >
            {{ $t("demo.form.empurrarErro") }}
        </button>
    </RForm>
</template>

<script setup lang="ts">
    import { useTemplateRef } from "vue";

    type Cadastro = { nome?: string; email?: string };

    const { data } = useRForm<Cadastro>();

    const form = useTemplateRef<{
        setErrors: (input?: Record<string, unknown>) => Promise<void>;
    }>("form");

    const { t } = useI18n();

    // O que a API devolveria: o Form distribui o objeto por `name`, e nenhum campo
    // aqui carrega `:error`.
    const enviar = async (enviado: Cadastro) => {
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (enviado.nome) {
            return { nome: t("demo.form.nomeRegistrado") };
        }
    };

    // O painel de model do `<Demo>` lê daqui: este exemplo monta o próprio `RForm`.
    defineExpose({ data });
</script>