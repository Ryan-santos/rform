<template>
    <ul class="flex flex-col gap-1.5">
        <li
            v-for="node in nodes"
            :key="node.path"
            class="flex flex-col gap-1.5"
        >
            <div class="flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
                <code
                    class="font-mono text-xs font-medium"
                    :class="node.kind === 'util' ? 'text-secondary' : 'text-contrast/80'"
                    >{{ node.key }}</code
                >

                <span
                    v-if="node.kind === 'util'"
                    class="rounded-sm bg-secondary/10 px-1 py-0.5 font-mono text-[0.625rem] leading-none font-bold text-secondary uppercase"
                    >util</span
                >

                <code
                    v-if="node.value !== undefined"
                    class="min-w-0 font-mono text-xs leading-relaxed break-words text-contrast/45"
                    >{{ node.value || $t("ui.noClass") }}</code
                >
            </div>

            <details
                v-if="node.children?.length && node.collapsed"
                class="ml-1 border-l border-contrast/10 pl-3"
            >
                <summary
                    class="w-fit cursor-pointer list-none font-mono text-[0.625rem] text-secondary/70 transition-colors hover:text-secondary"
                >
                    {{ $t("ui.layers") }} · {{ node.children.length }}
                </summary>

                <DemoUiLayer
                    :nodes="node.children"
                    class="mt-1.5"
                />
            </details>

            <DemoUiLayer
                v-else-if="node.children?.length"
                :nodes="node.children"
                class="ml-1 border-l border-contrast/10 pl-3"
            />
        </li>
    </ul>
</template>

<script setup lang="ts">
    /**
     * Um nível da árvore de `ui`, recursivo. A hierarquia é a linha da esquerda e o
     * recuo — sem caixa em volta de cada camada, que era o que fazia uma árvore de
     * seis níveis virar seis molduras aninhadas.
     *
     * Um util de árvore grande nasce fechado: o `ui` do Calendar tem mais camadas
     * que o campo inteiro.
     */
    import type { UiNode } from "~/utils/ui";

    defineProps<{
        nodes: UiNode[];
    }>();
</script>