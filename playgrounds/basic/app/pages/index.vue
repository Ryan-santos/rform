<template>
    <Scenario
        title="cadastro curto"
        :value="data"
    >
        <RForm
            v-model="data"
            class="flex flex-col gap-4"
        >
            <RText
                name="nome"
                label="form.nome"
                placeholder="form.nomeCompleto"
                required
                rule="required"
            />
            <RText
                name="email"
                label="form.email"
                placeholder="form.emailExemplo"
                rule="email"
            />
            <RSelect
                name="uf"
                label="form.uf"
                placeholder="form.selecione"
                :options="ufs"
            />

            <button
                type="submit"
                class="w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
                {{ $t("form.enviar") }}
            </button>
        </RForm>
    </Scenario>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const ufs = ["SP", "RJ", "MG", "BA", "RS"];

    const data = ref<Record<string, unknown>>({});
</script>