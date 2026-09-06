<template>
    <div class="flex min-w-0 grow flex-col xl:flex-row">
        <div class="flex min-w-0 grow flex-col gap-10 px-6 py-12 lg:px-10">
            <!-- A linha embaixo do cabeçalho separa a apresentação da página dos exemplos. -->
            <header class="flex flex-col gap-2 border-b border-contrast/10 pb-6">
                <div class="flex flex-row flex-wrap items-baseline gap-3">
                    <h1
                        class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold tracking-tight text-transparent"
                    >
                        {{ title }}
                    </h1>
                    <code
                        v-if="tag"
                        class="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-medium text-primary"
                    >
                        {{ tag }}
                    </code>
                </div>

                <p
                    v-if="description"
                    class="max-w-prose text-contrast/60"
                >
                    {{ description }}
                </p>
            </header>

            <RForm
                v-if="form"
                v-model="model"
                class="flex flex-col gap-8"
            >
                <slot :model />
            </RForm>

            <div
                v-else
                class="flex flex-col gap-8"
            >
                <slot :model />
            </div>
        </div>

        <aside
            class="sticky bottom-0 z-20 flex max-h-[45vh] flex-none flex-col border-t border-contrast/10 bg-background p-4 xl:top-0 xl:bottom-auto xl:h-screen xl:max-h-none xl:w-[26rem] xl:self-start xl:border-t-0 xl:border-l"
        >
            <slot
                name="output"
                :model
            >
                <DemoJson :value="model" />
            </slot>
        </aside>
    </div>
</template>

<script setup lang="ts">
    import { provide, ref, toRef } from "vue";

    import { demoSourceKey } from "~/utils/demo";

    const props = withDefaults(
        defineProps<{
            title: string;
            tag?: string;
            description?: string;
            /** The page's own text, from `import source from "./<page>.vue?raw"`. */
            source?: string;
            /** Wrap the examples in an `RForm` and print its model. Off for pages that own their forms. */
            form?: boolean;
            initial?: Record<string, unknown>;
        }>(),
        {
            tag: undefined,
            description: undefined,
            source: "",
            form: true,
            initial: undefined
        }
    );

    provide(
        demoSourceKey,
        toRef(() => props.source)
    );

    const model = ref<Record<string, unknown>>({ ...props.initial });
</script>