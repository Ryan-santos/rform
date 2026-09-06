<template>
    <div class="flex flex-col gap-2">
        <div
            v-for="node in nodes"
            :key="node.path"
            class="cursor-pointer rounded-lg border p-2 transition-all duration-300"
            :class="frame(node)"
            @click.stop="focus?.toggle(node.path)"
        >
            <div class="flex flex-row flex-wrap items-center gap-2">
                <span
                    v-if="node.kind === 'util'"
                    class="rounded-sm bg-secondary/15 px-1 py-0.5 font-mono text-[0.625rem] leading-none font-bold text-secondary uppercase"
                    >util</span
                >

                <span
                    class="font-mono text-xs leading-none font-medium transition-colors"
                    :class="label(node)"
                    >{{ node.key }}</span
                >

                <span
                    v-if="node.children?.length"
                    class="font-mono text-[0.625rem] leading-none text-contrast/30"
                    >{{ node.children.length }}</span
                >
            </div>

            <code
                v-if="node.value !== undefined"
                class="mt-2 block rounded-md bg-contrast/[0.06] px-2 py-1 font-mono text-xs leading-relaxed break-words text-contrast/70"
                >{{ node.value || $t("ui.noClass") }}</code
            >

            <details
                v-if="node.children?.length && node.collapsed"
                class="mt-2"
            >
                <summary
                    class="w-fit cursor-pointer list-none rounded-sm bg-secondary/10 px-1.5 py-0.5 font-mono text-[0.625rem] text-secondary transition-colors hover:bg-secondary/20"
                    @click.stop
                >
                    {{ $t("ui.layers") }}
                </summary>

                <DemoUiLayer
                    :nodes="node.children"
                    :depth="depth + 1"
                    class="mt-2"
                />
            </details>

            <DemoUiLayer
                v-else-if="node.children?.length"
                :nodes="node.children"
                :depth="depth + 1"
                class="mt-2"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    /**
     * Um nível da árvore de `ui`, recursivo. A classe da camada ganha fundo próprio,
     * senão sumiria sobre a cor da caixa; e um util de árvore grande nasce fechado,
     * porque o `ui` do Calendar tem mais camadas que o campo inteiro.
     */
    import { inject } from "vue";

    import { uiFocusKey, type UiNode } from "~/utils/ui";

    const props = withDefaults(
        defineProps<{
            nodes: UiNode[];
            depth?: number;
        }>(),
        {
            depth: 0
        }
    );

    // O foco é do `DemoUi`, não de cada nível: injetar em vez de descer por prop é o
    // que deixa uma camada saber que outra, em outra ramificação, está presa.
    const focus = inject(uiFocusKey, undefined);

    // O fundo alterna a cada nível, e é o que faz a caixa aninhada se destacar da que
    // a contém. Tinta de cor fica reservada ao foco e aos Utils.
    const surface = () => (props.depth % 2 === 0 ? "bg-background" : "bg-background-100");

    const frames = {
        ui: {
            idle: "border-contrast/25 hover:border-primary",
            active: "border-primary ring-2 ring-primary/40",
            related: "border-primary/50",
            dimmed: "border-contrast/15 opacity-40"
        },
        util: {
            idle: "border-secondary/40 hover:border-secondary",
            active: "border-secondary ring-2 ring-secondary/40",
            related: "border-secondary/60",
            dimmed: "border-secondary/20 opacity-40"
        }
    };

    const labels = {
        ui: { active: "text-primary", idle: "text-contrast/80" },
        util: { active: "text-secondary", idle: "text-secondary" }
    };

    const kind = (node: UiNode) => (node.kind === "util" ? "util" : "ui");

    /** Tracejado é chave de `ui`, sólido é Util — a borda separa antes da cor. */
    const frame = (node: UiNode) => [
        frames[kind(node)][focus?.state(node.path) ?? "idle"],
        node.kind === "util" ? "border-solid bg-secondary/[0.07]" : `border-dashed ${surface()}`
    ];

    const label = (node: UiNode) =>
        labels[kind(node)][focus?.state(node.path) === "active" ? "active" : "idle"];
</script>