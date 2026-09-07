<template>
    <Scenario
        title="pack do usuário mescla no embutido"
        :value="data"
    >
        <RForm
            v-model="data"
            class="flex flex-col gap-4"
        >
            <RArray
                v-slot="{ index }"
                name="contatos"
                label="Contatos"
                :min="1"
            >
                <RText
                    :name="index"
                    placeholder="contato"
                    rule="required"
                />
            </RArray>

            <RSelect
                name="uf"
                label="UF"
                placeholder="selecione"
                :options="['SP', 'RJ', 'MG']"
                search
            />

            <RFile
                name="anexo"
                label="Anexo"
                accept="png, jpg"
                :max-size="1024"
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

    // `app/rform/locales/pt-BR.ts` troca duas chaves; `es.ts` só tem essas duas, e
    // o resto do pack cai no fallback. Troque o idioma no cabeçalho.
    const data = ref<Record<string, unknown>>({});
</script>