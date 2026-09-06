<template>
    <div class="flex flex-col gap-6">
        <Card title="tema">
            <div class="flex flex-row flex-wrap gap-2">
                <button
                    v-for="tema in temas"
                    :key="tema.nome"
                    type="button"
                    class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors"
                    :class="
                        atual === tema.nome
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-contrast/10 text-contrast/60'
                    "
                    @click="atual = tema.nome"
                >
                    {{ tema.nome }}
                </button>
            </div>

            <Json :value="vars" />
        </Card>

        <Scenario :value="data">
            <div :style="vars">
                <RForm
                    v-model="data"
                    class="flex flex-col gap-4"
                >
                    <RText
                        name="nome"
                        label="Nome"
                        placeholder="como te chamam"
                        required
                    />
                    <RText
                        name="erro"
                        label="Com erro"
                        error="A mensagem usa --rf-color-danger."
                    />
                    <RSelect
                        name="uf"
                        label="UF"
                        placeholder="selecione"
                        :options="['SP', 'RJ', 'MG']"
                    />
                    <RSwitch
                        name="ligado"
                        placeholder="Ligado"
                        :default="true"
                    />
                </RForm>
            </div>
        </Scenario>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";

    // Nenhum `ui` é tocado aqui: o que muda é o valor das variáveis, num style
    // inline sobre o wrapper.
    const temas = [
        {
            nome: "padrão",
            vars: {}
        },
        {
            nome: "quadrado",
            vars: {
                "--rf-radius-sm": "0px",
                "--rf-radius-md": "0px",
                "--rf-radius-lg": "0px",
                "--rf-radius-xl": "0px",
                "--rf-radius-2xl": "0px"
            }
        },
        {
            nome: "roxo",
            vars: {
                "--rf-color-primary": "oklch(0.55 0.22 300)",
                "--rf-color-primary-fg": "#ffffff",
                "--rf-radius-xl": "1.5rem"
            }
        },
        {
            nome: "alto contraste",
            vars: {
                "--rf-color-background-100": "#000000",
                "--rf-color-contrast": "#ffffff",
                "--rf-color-primary": "#ffee00",
                "--rf-color-primary-fg": "#000000",
                "--rf-color-danger": "#ff5555"
            }
        }
    ];

    const atual = ref("padrão");

    const data = ref<Record<string, unknown>>({});

    const vars = computed(() => temas.find((tema) => tema.nome === atual.value)?.vars ?? {});
</script>