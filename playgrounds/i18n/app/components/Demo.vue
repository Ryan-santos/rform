<template>
    <section class="flex flex-col gap-3 border-b border-contrast/10 pb-8 last:border-b-0 last:pb-0">
        <header class="flex flex-col gap-1">
            <h2 class="flex flex-row items-center gap-2 text-lg leading-tight font-semibold">
                <span class="h-4 w-1 flex-none rounded-full bg-primary" />
                {{ title }}
            </h2>
            <p
                v-if="description"
                class="max-w-prose text-sm text-contrast/50"
            >
                {{ description }}
            </p>
        </header>

        <div :class="ui">
            <slot />
        </div>

        <details
            v-if="setup || code"
            open
            class="flex flex-col gap-2"
        >
            <summary
                class="w-fit cursor-pointer list-none rounded-md bg-secondary/10 px-2 py-1 text-xs font-bold tracking-widest text-secondary uppercase transition-colors hover:bg-secondary/20"
            >
                código
            </summary>

            <div class="mt-2 flex flex-col gap-3">
                <DemoCode
                    v-if="setup"
                    :code="setup"
                    lang="ts"
                    label="script setup"
                    body-class="max-h-80 overflow-auto"
                />

                <DemoCode
                    v-if="code"
                    :code="code"
                    lang="vue"
                    label="template"
                    body-class="max-h-80 overflow-auto"
                />
            </div>
        </details>
    </section>
</template>

<script setup lang="ts">
    /**
     * Um exemplo da página: renderiza o próprio slot ao vivo e, abaixo, o recorte do
     * fonte que o produziu — o mesmo arquivo, não uma segunda cópia.
     */
    import { computed, inject, ref } from "vue";

    import { demoSourceKey, extractDemo, extractRegion } from "~/utils/demo";

    const props = withDefaults(
        defineProps<{
            /** Casado verbatim contra o fonte para achar este bloco no template. */
            id: string;
            title: string;
            description?: string;
            /** Nome de um bloco `// #region` do script da página, mostrado acima do template. */
            script?: string;
            /** Classes do wrapper em volta do exemplo vivo. */
            ui?: string;
        }>(),
        {
            description: undefined,
            script: undefined,
            ui: "flex flex-col gap-4"
        }
    );

    const source = inject(demoSourceKey, ref(""));

    const code = computed(() => extractDemo(source.value, props.id));

    const setup = computed(() => (props.script ? extractRegion(source.value, props.script) : ""));
</script>