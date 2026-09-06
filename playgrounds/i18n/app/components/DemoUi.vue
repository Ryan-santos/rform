<template>
    <section class="flex flex-col gap-4 border-b border-contrast/10 pb-8 last:border-b-0 last:pb-0">
        <header class="flex flex-col gap-1">
            <h2 class="flex flex-row items-center gap-2 text-lg leading-tight font-semibold">
                <span class="h-4 w-1 rounded-full bg-gradient-to-b from-primary to-secondary" />
                ui — camadas e estilo padrão
            </h2>
            <p class="max-w-prose text-sm text-contrast/50">
                Cada caixa é uma camada do campo, aninhada como no DOM: as tracejadas são chaves de
                <code class="font-mono">ui</code>, as sólidas marcadas com
                <span class="font-medium text-secondary">util</span> são os
                <code class="font-mono">RUtils</code> montados dentro delas. Clique para travar o
                foco; clique de novo para soltar.
            </p>
        </header>

        <div
            class="sticky top-2 z-10 flex flex-col gap-1 rounded-xl border p-3 backdrop-blur-sm transition-colors duration-300"
            :class="
                focused
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-contrast/10 bg-background-50/80'
            "
        >
            <p class="font-mono text-xs text-contrast/40">camada em foco</p>

            <template v-if="focused">
                <code
                    class="font-mono text-sm font-bold"
                    :class="focused.kind === 'util' ? 'text-secondary' : 'text-primary'"
                    >{{ focused.path }}</code
                >
                <code
                    v-if="focused.value !== undefined"
                    class="font-mono text-xs leading-relaxed break-words text-contrast/60"
                    >{{ focused.value || '"" (sem classe por padrão)' }}</code
                >
                <p
                    v-else
                    class="text-xs text-contrast/50"
                >
                    camada com {{ focused.children?.length ?? 0 }} filhas dentro.
                </p>
            </template>

            <p
                v-else
                class="text-xs text-contrast/50"
            >
                nenhuma — clique numa caixa abaixo.
            </p>
        </div>

        <div class="flex flex-col gap-4">
            <div
                class="flex flex-col gap-3 rounded-xl border border-contrast/10 bg-background-50 p-4"
            >
                <p class="font-mono text-xs text-contrast/40">
                    <span class="font-medium text-primary">R{{ component }}</span> · árvore de
                    camadas
                </p>

                <DemoUiLayer
                    v-if="nodes.length"
                    :nodes="nodes"
                />

                <p
                    v-else
                    class="text-sm text-contrast/40"
                >
                    Nenhuma camada lida de <code class="font-mono">{{ component }}.vue</code> — o
                    <code class="font-mono">defaults</code> do componente não chegou até aqui.
                </p>
            </div>

            <DemoCode
                :code="snippet"
                lang="ts"
                label="estilo completo"
                :hint="`ui de R${component} e dos Utils`"
                body-class="max-h-[40rem] overflow-auto"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
    /**
     * Página de `ui` de um campo: a árvore de camadas que o componente declara, mais o
     * recorte de `defaults.ts` pronto para copiar.
     *
     * A caixa de foco fica acima do diagrama, e não ao lado: em coluna única ela sairia
     * do campo de visão justamente quando o clique acontece lá embaixo. Árvore e código
     * ficam empilhados pelo mesmo motivo — lado a lado, nenhum dos dois respira.
     */
    import { computed, provide, ref } from "vue";

    import { fieldTree, uiFocusKey, uiSnippet, type UiNode } from "~/utils/ui";

    const props = defineProps<{
        /** Nome do componente sem o prefixo `R` — "Text", "Select", … */
        component: string;
    }>();

    const nodes = computed(() => fieldTree(props.component));

    const snippet = computed(() => uiSnippet(props.component));

    const path = ref<string | null>(null);

    const toggle = (next: string) => {
        path.value = path.value === next ? null : next;
    };

    // Ancestral e descendente da camada presa continuam acesos: sem isso o foco
    // apagaria justamente a moldura que dá contexto a ele.
    const state = (candidate: string) => {
        const current = path.value;

        if (!current) {
            return "idle" as const;
        }

        if (current === candidate) {
            return "active" as const;
        }

        if (current.startsWith(`${candidate}.`) || candidate.startsWith(`${current}.`)) {
            return "related" as const;
        }

        return "dimmed" as const;
    };

    provide(uiFocusKey, { path, toggle, state });

    const index = computed(() => {
        const all = new Map<string, UiNode>();

        const walk = (list: UiNode[]) => {
            for (const node of list) {
                all.set(node.path, node);

                if (node.children) {
                    walk(node.children);
                }
            }
        };

        walk(nodes.value);

        return all;
    });

    const focused = computed(() => (path.value ? index.value.get(path.value) : undefined));
</script>