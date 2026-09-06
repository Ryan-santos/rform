<template>
    <div class="flex flex-col gap-4">
        <Card
            title="app/rform/defaults.ts, aplicado"
            description="Nenhum campo abaixo passa ui. O input maior, o placeholder em versalete e o erro em itálico vêm todos do arquivo do projeto."
        >
            <RForm
                v-model="data"
                class="flex flex-col gap-4"
            >
                <RText
                    name="nome"
                    label="Nome"
                    placeholder="input com p-4, do defaults"
                />
                <RText
                    name="erro"
                    label="Erro"
                    error="Itálico e menor, do bloco Utils."
                />
                <RSelect
                    name="uf"
                    label="Select com popover w-80"
                    placeholder="selecione"
                    :options="['SP', 'RJ', 'MG', 'BA', 'RS']"
                />
                <RTextarea
                    name="obs"
                    label="Textarea, que o defaults não toca"
                    placeholder="o padrão do componente"
                    :rows="2"
                />
            </RForm>
        </Card>

        <Card
            title="A prop ainda ganha"
            description="O mesmo RText, com ui no call site: a última fonte da cadeia."
        >
            <RForm
                v-model="data"
                class="flex flex-col gap-4"
            >
                <RText
                    name="vencido"
                    label="Com ui no campo"
                    placeholder="p-1, contra o p-4 do defaults"
                    :ui="{
                        group: {
                            field: {
                                input: 'p-1 text-xs'
                            }
                        }
                    }"
                />
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