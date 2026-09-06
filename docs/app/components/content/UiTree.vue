<template>
    <section class="flex flex-col gap-4">
        <div
            class="sticky top-2 z-10 flex flex-col gap-1 rounded-xl border p-3 backdrop-blur-sm transition-colors duration-300"
            :class="
                focused
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-contrast/10 bg-background-50/80'
            "
        >
            <p class="font-mono text-xs text-contrast/40">{{ $t("ui.focused") }}</p>

            <template v-if="focused">
                <code
                    class="font-mono text-sm font-bold"
                    :class="focused.kind === 'util' ? 'text-secondary' : 'text-primary'"
                    >{{ focused.path }}</code
                >
                <code
                    v-if="focused.value !== undefined"
                    class="font-mono text-xs leading-relaxed break-words text-contrast/60"
                    >{{ focused.value || $t("ui.noClass") }}</code
                >
                <p
                    v-else
                    class="text-xs text-contrast/50"
                >
                    {{ $t("ui.children", { n: focused.children?.length ?? 0 }) }}
                </p>
            </template>

            <p
                v-else
                class="text-xs text-contrast/50"
            >
                {{ $t("ui.focusHint") }}
            </p>
        </div>

        <div class="flex flex-col gap-3 rounded-xl border border-contrast/10 bg-background-50 p-4">
            <p class="font-mono text-xs text-contrast/40">
                <span class="font-medium text-primary">R{{ component }}</span> ·
                {{ $t("ui.layerTree") }}
            </p>

            <DemoUiLayer
                v-if="nodes.length"
                :nodes="nodes"
            />

            <p
                v-else
                class="text-sm text-contrast/40"
            >
                {{ $t("ui.noLayers", { component }) }}
            </p>
        </div>

        <DemoCode
            :code="snippet"
            lang="ts"
            :label="$t('ui.fullStyle')"
            hint="app/rform/defaults.ts"
            body-class="max-h-[40rem] overflow-auto"
        />
    </section>
</template>

<script setup lang="ts">
    /**
     * `::ui-tree{component="Text"}` — a árvore de camadas que o componente declara,
     * lida do `defaults.ui` do próprio módulo, mais o recorte de `defaults.ts`
     * pronto para copiar.
     *
     * A caixa de foco fica acima do diagrama, e não ao lado: em coluna única ela
     * sairia do campo de visão justamente quando o clique acontece lá embaixo.
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