<template>
    <section class="flex flex-col gap-3 rounded-2xl border border-contrast/10 bg-background-50 p-5">
        <header
            v-if="title || $slots.default"
            class="flex flex-col gap-1"
        >
            <h3
                v-if="title"
                class="flex flex-row items-center gap-2 text-base leading-tight font-semibold"
            >
                <span class="h-4 w-1 flex-none rounded-full bg-primary" />
                {{ title }}
            </h3>

            <div class="max-w-prose text-sm text-contrast/60 [&_p]:m-0">
                <slot />
            </div>
        </header>

        <div class="flex flex-col gap-6 xl:flex-row">
            <div class="flex min-w-0 grow flex-col gap-4">
                <RForm
                    v-if="form"
                    v-model="model"
                    :class="ui"
                >
                    <component :is="loaded" />
                </RForm>

                <div
                    v-else
                    :class="ui"
                >
                    <component :is="loaded" />
                </div>

                <p
                    v-if="!loaded"
                    class="rounded-lg bg-danger/10 px-3 py-2 font-mono text-xs text-danger"
                >
                    demo <b>{{ src }}</b> {{ $t("ui.demoMissing") }}
                </p>
            </div>

            <div
                v-if="form"
                class="flex flex-none flex-col xl:w-80"
            >
                <DemoJson :value="model" />
            </div>
        </div>

        <details
            v-if="code"
            class="flex flex-col gap-2"
        >
            <summary
                class="w-fit cursor-pointer list-none rounded-md bg-secondary/10 px-2 py-1 text-xs font-bold tracking-widest text-secondary uppercase transition-colors hover:bg-secondary/20"
            >
                {{ $t("ui.code") }}
            </summary>

            <DemoCode
                :code="code"
                lang="vue"
                :hint="`app/demos/${src}.vue`"
                body-class="max-h-96 overflow-auto"
                class="mt-2"
            />
        </details>
    </section>
</template>

<script setup lang="ts">
    /**
     * `::demo{src="Text/basico"}` — monta `app/demos/Text/basico.vue` ao vivo e
     * mostra o fonte do mesmo arquivo abaixo. O slot default é a prosa do exemplo.
     *
     * O `RForm` e o painel de model são deste componente, então o arquivo de demo
     * é só os campos; `:form="false"` desliga os dois para um demo que monta o
     * próprio formulário.
     */
    import { computed, defineAsyncComponent, ref } from "vue";

    import { demoComponent, demoSource, demoSourceOf } from "~/utils/demos";

    const props = withDefaults(
        defineProps<{
            /** Caminho relativo a `app/demos`, sem extensão — `"Text/basico"`. */
            src: string;
            title?: string;
            /** Embrulha o exemplo num `RForm` e imprime o model ao lado. */
            form?: boolean | string;
            /** Classes do wrapper em volta do exemplo vivo. */
            ui?: string;
        }>(),
        {
            title: undefined,
            form: true,
            ui: "flex flex-col gap-4"
        }
    );

    // MDC entrega prop de atributo como string: `:form="false"` chega `"false"`.
    const form = computed(() => props.form !== false && props.form !== "false");

    const loaded = computed(() => {
        const loader = demoComponent(props.src);

        return loader ? defineAsyncComponent(loader) : undefined;
    });

    // `useAsyncData`, e não um `watchEffect` assíncrono: o painel de código tem de
    // existir no HTML servido, senão o build estático publica o bloco vazio.
    const { data: code } = await useAsyncData(
        () => `demo-${props.src}`,
        async () => {
            const loader = demoSource(props.src);

            return loader ? demoSourceOf(await loader()) : "";
        },
        { watch: [() => props.src] }
    );

    const model = ref<Record<string, unknown>>({});
</script>