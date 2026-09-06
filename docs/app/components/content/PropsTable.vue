<template>
    <section class="flex flex-col gap-4">
        <div
            v-if="meta?.props.length"
            class="overflow-x-auto rounded-xl border border-contrast/10 bg-background-50"
        >
            <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
                <thead>
                    <tr>
                        <th
                            v-for="head in heads"
                            :key="head"
                            class="border-b border-contrast/15 px-3 py-2 text-xs font-bold tracking-widest text-contrast/50 uppercase"
                        >
                            {{ head }}
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr
                        v-for="prop in meta.props"
                        :key="prop.name"
                        class="align-top"
                    >
                        <td class="border-b border-contrast/5 px-3 py-2">
                            <code class="font-mono text-xs font-medium text-primary">{{
                                prop.name
                            }}</code>
                        </td>

                        <td class="max-w-md border-b border-contrast/5 px-3 py-2">
                            <details v-if="prop.type.length > TYPE_INLINE">
                                <summary
                                    class="w-fit cursor-pointer list-none font-mono text-xs text-secondary"
                                >
                                    {{ prop.type.slice(0, TYPE_INLINE) }}…
                                </summary>
                                <code
                                    class="mt-1 block font-mono text-xs leading-relaxed break-words text-contrast/60"
                                    >{{ prop.type }}</code
                                >
                            </details>

                            <code
                                v-else
                                class="font-mono text-xs break-words text-contrast/60"
                                >{{ prop.type }}</code
                            >
                        </td>

                        <td class="border-b border-contrast/5 px-3 py-2">
                            <code
                                v-if="prop.default"
                                class="font-mono text-xs text-contrast/60"
                                >{{ prop.default }}</code
                            >
                            <span
                                v-else
                                class="text-xs text-contrast/25"
                                >—</span
                            >
                        </td>

                        <td class="border-b border-contrast/5 px-3 py-2">
                            <span
                                class="font-mono text-xs"
                                :class="prop.required ? 'text-danger' : 'text-contrast/25'"
                                >{{ prop.required ? $t("ui.yes") : $t("ui.no") }}</span
                            >
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p
            v-else
            class="rounded-lg bg-warn/10 px-3 py-2 text-sm text-contrast/70"
        >
            {{ $t("ui.noProps", { component }) }}
        </p>

        <div
            v-if="meta?.slots.length || meta?.events.length"
            class="flex flex-row flex-wrap gap-6"
        >
            <div
                v-if="meta.slots.length"
                class="flex flex-col gap-1"
            >
                <p class="text-xs font-bold tracking-widest text-contrast/40 uppercase">
                    {{ $t("ui.slots") }}
                </p>
                <div class="flex flex-row flex-wrap gap-1">
                    <code
                        v-for="slot in meta.slots"
                        :key="slot"
                        class="rounded-md bg-secondary/10 px-2 py-1 font-mono text-xs text-secondary"
                        >#{{ slot }}</code
                    >
                </div>
            </div>

            <div
                v-if="meta.events.length"
                class="flex flex-col gap-1"
            >
                <p class="text-xs font-bold tracking-widest text-contrast/40 uppercase">
                    {{ $t("ui.events") }}
                </p>
                <div class="flex flex-row flex-wrap gap-1">
                    <code
                        v-for="event in meta.events"
                        :key="event"
                        class="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs text-primary"
                        >{{ "@" + event }}</code
                    >
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
    /**
     * `::props-table{component="Text"}` — a tabela de props, lida do `api.json` que
     * o `scripts/api.ts` gera do fonte pelo `vue-component-meta`.
     *
     * Ela é a verdade exaustiva (nome/tipo/default/obrigatoriedade) e nunca
     * desatualiza; a explicação de cada prop mora na prosa ao lado, porque não há
     * JSDoc por prop no módulo para o checker ler.
     */
    import { computed } from "vue";

    import api from "~/generated/api.json";

    const props = withDefaults(
        defineProps<{
            /** Nome do arquivo do componente, sem o prefixo `R` — "Text", "Label". */
            component: string;
            /** `util` desambigua `Calendar`, que existe nas duas pastas. */
            kind?: "field" | "util" | "root";
        }>(),
        {
            kind: undefined
        }
    );

    /** O `ui` de um campo passa de 2 kB de tipo; inline só cabe o começo. */
    const TYPE_INLINE = 90;

    const { t } = useI18n();

    const heads = computed(() => [
        t("ui.propName"),
        t("ui.propType"),
        t("ui.propDefault"),
        t("ui.propRequired")
    ]);

    const meta = computed(() =>
        api.find(
            (entry) => entry.name === props.component && (!props.kind || entry.kind === props.kind)
        )
    );
</script>