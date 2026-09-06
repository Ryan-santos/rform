<template>
    <Scenario
        title="sem ui nenhum"
        :value="data"
    >
        <RForm
            v-model="data"
            class="flex flex-col gap-4"
        >
            <RText
                name="nome"
                label="Nome"
                placeholder="como te chamam"
                required
                rule="required"
            />
            <RSelect
                name="uf"
                label="UF"
                placeholder="selecione"
                :options="['SP', 'RJ', 'MG']"
            />
            <RDate
                name="nascimento"
                label="Nascimento"
            />
            <RSwitch
                name="ativo"
                placeholder="Ativo"
                :default="true"
            />

            <button
                type="submit"
                class="w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
                submit
            </button>
        </RForm>
    </Scenario>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    // A linha de base: só o `defaults.ts` do app e os tokens do `main.css`.
    const data = ref<Record<string, unknown>>({});
</script>