<template>
    <section class="flex flex-col gap-4">
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
     */
    import { computed } from "vue";

    import { fieldTree, uiSnippet } from "~/utils/ui";

    const props = defineProps<{
        /** Nome do componente sem o prefixo `R` — "Text", "Select", … */
        component: string;
    }>();

    const nodes = computed(() => fieldTree(props.component));

    const snippet = computed(() => uiSnippet(props.component));
</script>