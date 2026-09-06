<template>
    <div class="flex flex-col gap-4">
        <Card
            title="Mesmo code mescla"
            description="app/rform/locales/pt-BR.ts declara duas chaves. O resto do pack continua vindo do embutido — nada some."
        >
            <div class="flex flex-row items-center gap-3 pb-2">
                <span class="text-xs text-contrast/40">idioma</span>
                <Locale />
            </div>

            <RForm v-model="data">
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
                />

                <button
                    type="submit"
                    class="mt-2 w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
                >
                    submit
                </button>
            </RForm>
        </Card>

        <Card
            title="Um code que o pack embutido não tem"
            description="es só declara duas chaves. Escolha 'es' acima: o botão do RArray fala espanhol, e o texto de busca do RSelect cai no fallback — o pack default."
        >
            <p class="font-mono text-xs text-contrast/50">app/rform/locales/es.ts</p>
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