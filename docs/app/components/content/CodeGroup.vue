<template>
    <div class="flex flex-col gap-2">
        <div
            v-if="labels.length > 1"
            class="flex w-fit flex-row gap-0.5 rounded-lg bg-background-100 p-1"
        >
            <button
                v-for="(label, index) in labels"
                :key="label"
                type="button"
                class="cursor-pointer rounded-md px-3 py-1 font-mono text-xs transition-colors"
                :class="
                    index === active
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-contrast/50 hover:text-contrast'
                "
                @click="active = index"
            >
                {{ label }}
            </button>
        </div>

        <DemoCode
            :code="blocks[active]?.code ?? ''"
            :lang="blocks[active]?.lang ?? 'ts'"
            :label="labels[active]"
            body-class="max-h-[32rem] overflow-auto"
        />
    </div>
</template>

<script setup lang="ts">
    /**
     * `::code-group` com um `:blocks` de `{ label, lang, code }` — as abas de
     * código da prosa, pintadas pelo mesmo `highlight()` dos demos.
     */
    import { computed, ref } from "vue";

    import type { Lang } from "~/utils/highlight";

    const props = defineProps<{
        blocks: { label: string; lang?: Lang; code: string }[];
    }>();

    const labels = computed(() => props.blocks.map((block) => block.label));

    const active = ref(0);
</script>