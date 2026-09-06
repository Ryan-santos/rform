<template>
    <div class="flex flex-col gap-4">
        <Card
            title="A assimetria do ~~"
            description="Num app COM @nuxtjs/i18n, tr remove o marcador. Sem ponte, tr é a identidade para tudo que não começa com rform. — então o ~~ sobrevive na tela. É custo aceito, não bug: sem i18n não há nada contra o que resolver uma chave do app."
        >
            <RForm v-model="data">
                <RText
                    name="literal"
                    label="~~Este label tem ~~ na frente"
                    placeholder="e ele aparece"
                />
                <RText
                    name="direto"
                    label="Este não tem"
                    placeholder="e é o jeito de escrever aqui"
                />
            </RForm>
        </Card>

        <Card
            title="Chave do módulo, escrita por extenso"
            description="rform.* continua resolvendo: é o único prefixo que o motor próprio trata."
        >
            <p class="font-mono text-sm text-primary">tr("rform.formats.date") → {{ pattern }}</p>
        </Card>

        <Card title="model">
            <Json :value="data" />
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    import { tr } from "#rform/utils";

    const data = ref<Record<string, unknown>>({});

    const pattern = computed(() => tr("rform.formats.date"));
</script>