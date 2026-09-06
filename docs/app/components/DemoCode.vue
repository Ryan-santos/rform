<template>
    <div class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-code-line bg-code">
        <header
            class="flex flex-none flex-row items-center justify-between gap-2 border-b border-code-line bg-code-head px-3 py-2"
        >
            <div class="flex min-w-0 flex-row items-baseline gap-2">
                <span
                    class="size-2 flex-none rounded-full"
                    :class="accent ? 'bg-secondary' : 'bg-code-text/25'"
                />
                <h3
                    class="truncate text-xs font-bold tracking-widest uppercase"
                    :class="accent ? 'text-secondary' : 'text-code-text/70'"
                >
                    {{ label ?? $t("ui.code") }}
                </h3>
                <span
                    v-if="hint"
                    class="truncate font-mono text-xs text-code-text/35"
                    >{{ hint }}</span
                >
            </div>

            <button
                type="button"
                :aria-label="copied ? $t('ui.copied') : $t('ui.copy')"
                :title="copied ? $t('ui.copied') : $t('ui.copy')"
                class="flex size-7 flex-none cursor-pointer items-center justify-center rounded-md transition-colors"
                :class="copied ? 'text-secondary' : 'text-code-text/40 hover:text-code-text'"
                @click="copy"
            >
                <Icon
                    :name="copied ? 'mi:check' : 'mi:copy'"
                    class="size-4"
                />
            </button>
        </header>

        <!-- eslint-disable-next-line vue/no-v-html -- markup do shiki, sobre texto já escapado -->
        <pre
            data-allow-mismatch
            class="overflow-auto p-3 font-mono text-xs leading-relaxed text-code-text/80"
            :class="bodyClass"
            v-html="html"
        />
    </div>
</template>

<script setup lang="ts">
    /**
     * Bloco de código com realce do shiki.
     *
     * `json` é pintado no browser, porque o painel de model muda a cada tecla.
     * `vue` e `ts` são pintados no server e o HTML viaja pelo payload — a
     * gramática de `vue` arrasta ts, js e css, e nada disso cabe no bundle.
     */
    import { computed, ref, useId } from "vue";

    import { bundled, escapeHtml, highlight, type Lang, paint } from "~/utils/highlight";

    const props = withDefaults(
        defineProps<{
            code: string;
            lang?: Lang;
            label?: string;
            hint?: string;
            /** Pinta o marcador e o rótulo na cor de saída — é o painel de model. */
            accent?: boolean;
            /** Classes do `<pre>` — é onde o scroll e a altura máxima moram. */
            bodyClass?: string;
        }>(),
        {
            lang: "ts",
            label: undefined,
            hint: undefined,
            accent: false,
            bodyClass: "grow"
        }
    );

    const live = computed(() => bundled(props.lang));

    // `useAsyncData` é o que põe o HTML no payload: sem ele o build estático
    // publica o bloco sem cor, e o browser teria de baixar a gramática.
    const { data } = await useAsyncData(
        useId(),
        () => (live.value ? Promise.resolve(null) : highlight(props.code, props.lang)),
        { watch: [() => props.code, () => props.lang] }
    );

    const html = computed(() =>
        live.value ? paint(props.code, props.lang) : (data.value ?? escapeHtml(props.code))
    );

    const copied = ref(false);

    const copy = async () => {
        await navigator.clipboard?.writeText(props.code);

        copied.value = true;

        setTimeout(() => (copied.value = false), 1500);
    };
</script>