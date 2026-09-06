<template>
    <DemoPage
        title="ui e Defaults"
        tag="defineFieldDefaults"
        :source
        description="Toda camada visual de um campo tem nome, e todo nome pode ser sobrescrito — num campo só, no projeto inteiro ou nos Utils. Esta página mostra a cadeia inteira: o que o componente declara, o que o seu arquivo de defaults muda e o que a prop do call site decide."
    >
        <section class="flex flex-col gap-3 border-b border-contrast/10 pb-8">
            <h2 class="flex flex-row items-center gap-2 text-lg leading-tight font-semibold">
                <span class="h-4 w-1 flex-none rounded-full bg-primary" />
                a cadeia de precedência
            </h2>

            <p class="max-w-prose text-sm text-contrast/50">
                Os três entram no mesmo <code class="font-mono">merger</code>, nesta ordem — e quem
                chega depois manda. Por isso prop no campo sempre ganha do arquivo de defaults, que
                por sua vez sempre ganha do componente.
            </p>

            <ol class="flex flex-col gap-2 lg:flex-row lg:items-stretch">
                <li
                    v-for="(step, index) in chain"
                    :key="step.title"
                    class="flex flex-1 flex-col gap-1 rounded-xl border p-3"
                    :class="step.ui"
                >
                    <span class="font-mono text-[0.625rem] tracking-widest uppercase opacity-60">
                        {{ index + 1 }} · {{ step.when }}
                    </span>
                    <code class="font-mono text-sm font-bold">{{ step.title }}</code>
                    <span class="text-xs opacity-70">{{ step.text }}</span>
                </li>
            </ol>
        </section>

        <Demo
            id="prop-ui"
            title="ui no call site"
            description="A prop ui é um DeepPartial: você escreve só a camada que quer mudar. E quem junta as classes é o tailwind-merge, então p-6 substitui o p-3 do default sem levar embora o resto da camada — o anel de foco continua ali."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RText
                name="padrao"
                label="~~Padrão"
                placeholder="~~do jeito que o componente declara"
            />
            <RText
                name="comUi"
                label="~~Com ui"
                placeholder="~~input maior, resto intacto"
                :ui="{
                    group: {
                        field: {
                            input: 'p-6 text-lg'
                        }
                    }
                }"
            />
        </Demo>

        <Demo
            id="ui-null"
            script="ui-null"
            title="null apaga a camada"
            description="undefined significa “não passei”, e é ignorado. null é explícito: zera as classes daquela camada — string vazia não serve, porque o tailwind-merge junta e o default sobrevive. Hoje isso exige um cast: o mergerUI entende null, mas o tipo de ui só admite string | undefined."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RText
                name="semWrapper"
                label="~~Wrapper zerado"
                placeholder="~~sem fundo, sem borda, sem anel"
                :ui="semWrapper"
            />
            <RText
                name="wrapperNovo"
                label="~~Wrapper redesenhado"
                placeholder="~~null primeiro, classe nova depois"
                :ui="{
                    group: {
                        wrapper: {
                            container:
                                'flex flex-row items-center rounded-none border-b-2 border-secondary'
                        }
                    }
                }"
            />
        </Demo>

        <Demo
            id="ui-utils"
            title="ui.Utils — o campo mandando no Util"
            description="Label, Placeholder, Description, Error, Length e Loading são componentes à parte, com defaults próprios. O bloco Utils dentro do ui do campo alcança cada um deles, e só naquele campo."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RText
                name="erroPadrao"
                label="~~Erro padrão"
                error="Vermelho, como vem de fábrica."
            />
            <RText
                name="erroRosa"
                label="~~Erro reestilizado"
                error="Mesma mensagem, outra pele."
                :ui="{
                    Utils: {
                        Error: {
                            container:
                                'text-secondary text-xs italic tracking-normal font-normal ml-0'
                        }
                    }
                }"
            />
        </Demo>

        <section class="flex flex-col gap-3 border-b border-contrast/10 pb-8">
            <h2 class="flex flex-row items-center gap-2 text-lg leading-tight font-semibold">
                <span class="h-4 w-1 flex-none rounded-full bg-primary" />
                app/rform/defaults.ts
            </h2>

            <p class="max-w-prose text-sm text-contrast/50">
                Um arquivo, opcional, chaveado por nome de componente: é onde o projeto decide como
                todo <code class="font-mono">RText</code> se parece, sem repetir prop em campo
                nenhum. O bloco <code class="font-mono">Utils</code> no topo faz o mesmo para os
                sub-componentes, globalmente. O módulo gera um template vazio quando o arquivo não
                existe — então criar depois funciona, e este playground roda sem ele de propósito,
                para as páginas mostrarem o default de verdade.
            </p>

            <DemoCode
                :code="arquivo"
                lang="ts"
                label="app/rform/defaults.ts"
                hint="o arquivo inteiro; nada mais é necessário"
            />

            <div class="grid gap-3 md:grid-cols-2">
                <div
                    v-for="note in notes"
                    :key="note.title"
                    class="flex flex-col gap-1 rounded-xl border border-contrast/10 bg-background-50 p-3"
                >
                    <code class="font-mono text-xs font-bold text-secondary">{{ note.title }}</code>
                    <p class="text-xs text-contrast/60">
                        {{ note.text }}
                    </p>
                </div>
            </div>
        </section>

        <section class="flex flex-col gap-3 border-b border-contrast/10 pb-8">
            <h2 class="flex flex-row items-center gap-2 text-lg leading-tight font-semibold">
                <span class="h-4 w-1 flex-none rounded-full bg-primary" />
                do outro lado: defineDefaults
            </h2>

            <p class="max-w-prose text-sm text-contrast/50">
                É o que cada componente do módulo chama para declarar o que você acabou de
                sobrescrever: o <code class="font-mono">ui</code> completo mais o valor inicial do
                model. O <code class="font-mono">Element&lt;typeof defaults&gt;</code> tipa as props
                a partir daí — é por isso que o tipo de
                <code class="font-mono">modelValue</code> sai do
                <code class="font-mono">default</code>.
            </p>

            <DemoCode
                :code="componente"
                lang="ts"
                label="src/runtime/components/Text.vue"
                hint="recorte do módulo"
            />
        </section>

        <DemoUi component="Text" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./ui.vue?raw";

    // #region ui-null
    /**
     * `null` limpa a camada no `mergerUI`, mas o tipo de `ui` só admite
     * `string | undefined` — daí o cast, que o template não sabe fazer sozinho.
     */
    const semWrapper = {
        group: {
            wrapper: {
                container: null as unknown as string
            }
        }
    };
    // #endregion

    const chain = [
        {
            when: "componente",
            title: "defineDefaults",
            text: "O ui e o default que o RText declara no próprio arquivo.",
            ui: "border-contrast/15 bg-background-50"
        },
        {
            when: "projeto",
            title: "app/rform/defaults.ts",
            text: "defineFieldDefaults, por nome de componente e por Util.",
            ui: "border-secondary/40 bg-secondary/[0.07] text-secondary"
        },
        {
            when: "campo",
            title: ':ui="{ … }"',
            text: "A prop no call site. Última na fila, então é a que decide.",
            ui: "border-primary/50 bg-primary/[0.07] text-primary"
        }
    ];

    const notes = [
        {
            title: "tailwind-merge, não concatenação",
            text: "Classe nova só remove a antiga quando as duas brigam pela mesma propriedade. Passar p-6 troca o padding e mantém o resto da camada."
        },
        {
            title: "null zera, undefined ignora",
            text: "undefined é “não passei” e é pulado pelo merger; null é explícito e apaga as classes da camada."
        },
        {
            title: "Utils global vs. Utils do campo",
            text: "Utils no topo do arquivo vale para todo mundo; ui.Utils dentro de um campo vale só ali — e ganha do global."
        },
        {
            title: "o nome do helper é acordo, não detalhe",
            text: "defineFieldDefaults está escrito no oxlint.config.ts e no .vscode/settings.json. Renomear sem mexer nos dois faz o lint de classe e o IntelliSense pararem calados dentro do arquivo."
        }
    ];

    const arquivo = `import { defineFieldDefaults } from "#rform/utils";

export default defineFieldDefaults({
    Text: {
        ui: {
            container: "gap-2",
            group: {
                field: {
                    input: "p-4 text-base"
                }
            }
        },
        default: ""
    },
    Utils: {
        Placeholder: {
            ui: {
                default: "text-xs"
            }
        }
    }
});`;

    const componente = `export const defaults = defineDefaults({
    ui: {
        container: "flex grow flex-col gap-1",
        group: {
            wrapper: {
                container: "relative z-0 flex w-full flex-row items-center rounded-xl …",
                leading: "p-3 pr-0 flex",
                trailing: "p-3 pl-0 flex"
            },
            field: {
                container: "grow",
                input: "w-full rounded-lg bg-transparent outline-none p-3"
            }
        }
    },
    default: ""
});

export type Props = Element<typeof defaults, "text">
    & Utils["Placeholder"]
    & Utils["Error"];`;
</script>