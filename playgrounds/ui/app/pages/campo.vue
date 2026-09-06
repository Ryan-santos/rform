<template>
    <div class="flex flex-col gap-4">
        <Card
            title="ui é um DeepPartial"
            description="Você escreve só a camada que muda, e quem junta as classes é o tailwind-merge: p-6 troca o padding e o anel de foco continua ali."
        >
            <RForm
                v-model="data"
                class="grid gap-4 md:grid-cols-2"
            >
                <RText
                    name="padrao"
                    label="Padrão"
                    placeholder="do jeito que o componente declara"
                />
                <RText
                    name="grande"
                    label="Com ui"
                    placeholder="input maior, resto intacto"
                    :ui="{
                        group: {
                            field: {
                                input: 'p-6 text-lg'
                            }
                        }
                    }"
                />
            </RForm>
        </Card>

        <Card
            title="null apaga a camada"
            description="undefined é 'não passei' e é pulado. null é explícito: zera as classes. String vazia não serve, porque o tailwind-merge junta e o default sobrevive."
        >
            <RForm
                v-model="data"
                class="grid gap-4 md:grid-cols-2"
            >
                <RText
                    name="zerado"
                    label="Wrapper zerado"
                    placeholder="sem fundo, sem borda, sem anel"
                    :ui="semWrapper"
                />
                <RText
                    name="redesenhado"
                    label="Wrapper redesenhado"
                    placeholder="null primeiro, classe nova depois"
                    :ui="{
                        group: {
                            wrapper: {
                                container:
                                    'flex flex-row items-center rounded-none border-b-2 border-secondary'
                            }
                        }
                    }"
                />
            </RForm>
        </Card>

        <Card
            title="O popover é do Dropdown"
            description="Toda aparência de painel mora em ui.Utils.Dropdown.popover, nunca num class no template do campo — é por isso que Select, Date e Color convivem com larguras diferentes."
        >
            <RForm
                v-model="data"
                class="grid gap-4 md:grid-cols-2"
            >
                <RSelect
                    name="medido"
                    label="Largura medida"
                    placeholder="w-(--width), do dropdownFit"
                    :options="['SP', 'RJ', 'MG']"
                />
                <RSelect
                    name="fixo"
                    label="Largura fixa"
                    placeholder="w-96 vence o w-(--width) no twMerge"
                    :options="['SP', 'RJ', 'MG']"
                    :ui="{
                        Utils: {
                            Dropdown: {
                                popover: 'w-96'
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

    // `null` limpa a camada no `mergerUI`, mas o tipo de `ui` só admite
    // `string | undefined` — daí o cast, que o template não sabe fazer sozinho.
    const semWrapper = {
        group: {
            wrapper: {
                container: null as unknown as string
            }
        }
    };

    const data = ref<Record<string, unknown>>({});
</script>