<template>
    <div class="flex flex-col gap-4">
        <Card
            title="Trocar tema é trocar variável"
            description="Nenhum ui do módulo foi tocado abaixo. O que muda é o valor das variáveis, escrito num style inline no wrapper."
        >
            <div class="flex flex-row flex-wrap gap-2 pb-4">
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

            <div
                :style="vars"
                class="rounded-2xl border border-contrast/10 p-4"
            >
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
                        placeholder="usa --rf-color-primary"
                        :default="true"
                    />
                </RForm>
            </div>
        </Card>

        <Card
            title="As variáveis do tema em foco"
            description="É isto que o wrapper acima declara — e num app de verdade elas moram num @layer rform do seu CSS."
        >
            <Json :value="temas.find((tema) => tema.nome === atual)?.vars" />
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";

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