<template>
    <div class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-code-line bg-code">
        <header
            class="flex flex-none flex-row items-center justify-between gap-2 border-b border-code-line bg-code-head px-3 py-2"
        >
            <div class="flex min-w-0 flex-row items-baseline gap-2">
                <span
                    class="size-2 flex-none rounded-full bg-gradient-to-br from-primary to-secondary"
                />
                <h3 class="truncate text-xs font-bold tracking-widest text-code-text/70 uppercase">
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
                class="flex-none rounded-md px-2 py-1 text-xs text-code-text/40 transition-colors hover:text-secondary"
                @click="copy"
            >
                {{ copied ? $t("ui.copied") : $t("ui.copy") }}
            </button>
        </header>

        <!-- eslint-disable-next-line vue/no-v-html -- markup nosso, gerado por highlight() sobre texto já escapado -->
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
     * Bloco de código com realce, alimentado pelo `highlight()` do docs.
     */
    import { computed, ref } from "vue";

    import { highlight, type Lang } from "~/utils/highlight";

    const props = withDefaults(
        defineProps<{
            code: string;
            lang?: Lang;
            label?: string;
            hint?: string;
            /** Classes do `<pre>` — é onde o scroll e a altura máxima moram. */
            bodyClass?: string;
        }>(),
        {
            lang: "ts",
            label: undefined,
            hint: undefined,
            bodyClass: "grow"
        }
    );

    const html = computed(() => highlight(props.code, props.lang));

    const copied = ref(false);

    const copy = async () => {
        await navigator.clipboard?.writeText(props.code);

        copied.value = true;

        setTimeout(() => (copied.value = false), 1500);
    };
</script>