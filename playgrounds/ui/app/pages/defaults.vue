<template>
    <div class="flex flex-col gap-6">
        <Scenario
            title="sem ui no call site"
            :value="data"
        >
            <RForm
                v-model="data"
                class="flex flex-col gap-4"
            >
                <RText
                    name="nome"
                    label="Nome"
                    placeholder="input com p-4"
                />
                <RText
                    name="erro"
                    label="Erro"
                    error="Itálico e menor, do bloco Utils."
                />
                <RSelect
                    name="uf"
                    label="UF"
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
        </Scenario>

        <Scenario
            title="a prop ganha"
            :value="data"
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
        </Scenario>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const data = ref<Record<string, unknown>>({});
</script>