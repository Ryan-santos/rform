<template>
    <section
        class="@container flex flex-col overflow-hidden rounded-2xl border border-contrast/10 bg-background-50"
    >
        <header
            v-if="title || $slots.default"
            class="flex flex-col gap-1 border-b border-contrast/10 px-5 py-3"
        >
            <h3
                v-if="title"
                class="text-sm leading-tight font-semibold"
            >
                {{ title }}
            </h3>

            <div class="text-sm text-contrast/55 [&_p]:m-0">
                <slot />
            </div>
        </header>

        <div class="flex flex-col @2xl:flex-row @2xl:items-stretch">
            <div class="@container flex min-w-0 grow flex-col gap-4 p-5">
                <RForm
                    v-if="form"
                    v-model="model"
                    :class="ui"
                >
                    <component :is="loaded" />

                    <DemoActions v-if="actions" />
                </RForm>

                <div
                    v-else
                    :class="ui"
                >
                    <component
                        :is="loaded"
                        ref="inner"
                    />
                </div>

                <p
                    v-if="!loaded"
                    class="rounded-lg bg-danger/10 px-3 py-2 font-mono text-xs text-danger"
                >
                    demo <b>{{ src }}</b> {{ $t("ui.demoMissing") }}
                </p>
            </div>

            <div
                class="flex flex-none flex-col border-t border-contrast/10 p-5 @2xl:w-72 @2xl:border-t-0 @2xl:border-l @4xl:w-80"
            >
                <DemoJson
                    :value="data"
                    class="@2xl:sticky @2xl:top-20"
                />
            </div>
        </div>

        <footer
            v-if="code"
            class="border-t border-contrast/10"
        >
            <details class="group">
                <summary
                    class="flex cursor-pointer list-none flex-row items-center gap-2 px-5 py-2.5 text-xs text-contrast/45 transition-colors hover:text-contrast"
                >
                    <svg
                        viewBox="0 0 24 24"
                        class="size-3.5 transition-transform group-open:rotate-90"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="m9 6 6 6-6 6" />
                    </svg>

                    {{ $t("ui.code") }}

                    <code class="font-mono text-contrast/25">app/demos/{{ src }}.vue</code>
                </summary>

                <div class="px-5 pb-5">
                    <DemoCode
                        :code="code"
                        lang="vue"
                        :hint="`app/demos/${src}.vue`"
                        body-class="max-h-96 overflow-auto"
                    />
                </div>
            </details>
        </footer>
    </section>
</template>

<script setup lang="ts">
    /**
     * `::demo{src="Text/basico"}` — monta `app/demos/Text/basico.vue` ao vivo, com
     * o model ao lado e o fonte do mesmo arquivo embaixo. O slot default é a prosa
     * do exemplo.
     *
     * O `RForm` é deste componente, então o arquivo de demo é só os campos.
     * `:form="false"` desliga o wrapper para um demo que monta o próprio
     * formulário — e aí o model vem do `defineExpose({ data })` dele, que é o que
     * mantém o painel ao lado em todo bloco.
     */
    import { computed, defineAsyncComponent, ref, useTemplateRef } from "vue";

    import { demoComponent, demoSource } from "~/utils/demos";
    import { demoSourceOf } from "~/utils/demoSource";

    const props = withDefaults(
        defineProps<{
            /** Caminho relativo a `app/demos`, sem extensão — `"Text/basico"`. */
            src: string;
            title?: string;
            /** Embrulha o exemplo num `RForm` deste componente. */
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

    // Um demo que declara `rule` precisa do submit para provar a validação, e quem
    // a roda é o `RForm` daqui. O que já traz o próprio `DemoActions` não ganha um
    // segundo par de botões.
    const actions = computed(() => {
        const source = code.value ?? "";

        return form.value && source.includes("rule=") && !source.includes("DemoActions");
    });

    const model = ref<Record<string, unknown>>({});

    const inner = useTemplateRef<{ data?: unknown }>("inner");

    const data = computed(() => (form.value ? model.value : (inner.value?.data ?? {})));
</script>