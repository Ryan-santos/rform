<template>
    <div class="flex flex-col gap-4">
        <Card
            title="O motor de tradução próprio"
            description="Este app não tem @nuxtjs/i18n. O rform resolve as chaves dele por conta própria, com @intlify/core — e o locale ativo é um useState."
        >
            <div class="flex flex-row items-center gap-3">
                <span class="text-xs text-contrast/40">idioma</span>
                <Locale />
            </div>

            <ul class="flex list-disc flex-col gap-2 pl-6 text-sm text-contrast/70">
                <li><b>/packs</b> — o pack do usuário mesclando por cima do embutido.</li>
                <li><b>/til</b> — a assimetria do <code class="font-mono">~~</code>.</li>
            </ul>
        </Card>

        <Card
            title="Um campo, com as mensagens do módulo"
            description="O botão do RArray e a mensagem da rule required saem do pack. Troque o idioma acima."
        >
            <RForm v-model="data">
                <RArray
                    v-slot="{ index }"
                    name="itens"
                    label="Itens"
                    :min="1"
                >
                    <RText
                        :name="index"
                        placeholder="um item"
                        rule="required"
                    />
                </RArray>

                <button
                    type="submit"
                    class="mt-2 w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
                >
                    submit
                </button>
            </RForm>
        </Card>

        <Card title="model">
            <Json :value="data" />
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const data = ref<Record<string, unknown>>({});
</script>