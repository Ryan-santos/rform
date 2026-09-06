<template>
    <div class="flex flex-col gap-6">
        <Scenario
            title="~~ sobrevive sem ponte"
            :value="data"
        >
            <RForm
                v-model="data"
                class="flex flex-col gap-4"
            >
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
        </Scenario>

        <Card title="chave do módulo, por extenso">
            <p class="font-mono text-sm text-primary">tr("rform.formats.date") → {{ pattern }}</p>
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";

    import { tr } from "#rform/utils";

    const data = ref<Record<string, unknown>>({});

    const pattern = computed(() => tr("rform.formats.date"));
</script>