<template>
    <Scenario
        title="mensagens do módulo, sem @nuxtjs/i18n"
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
                rule="required"
            />
            <RText
                name="apelido"
                label="Apelido"
                :rule="{ name: 'min', min: 5 }"
            />
            <RDate
                name="nascimento"
                label="Nascimento"
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

    const data = ref<Record<string, unknown>>({});
</script>