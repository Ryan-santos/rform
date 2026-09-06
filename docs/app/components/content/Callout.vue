<template>
    <aside
        class="flex max-w-prose flex-row gap-3 rounded-xl border-l-2 p-4 text-sm"
        :class="tone"
    >
        <Icon
            :name="icon"
            class="mt-0.5 size-4 flex-none"
        />

        <div class="flex min-w-0 flex-col gap-2 [&_p]:m-0">
            <slot />
        </div>
    </aside>
</template>

<script setup lang="ts">
    /**
     * `::callout{type="warn"}` — o aviso da prosa. Quatro tons, e o ícone sai do
     * tom, para o markdown não ter de escolher os dois.
     */
    import { computed } from "vue";

    const props = withDefaults(
        defineProps<{
            type?: "info" | "tip" | "warn" | "danger";
        }>(),
        {
            type: "info"
        }
    );

    const tones = {
        info: "border-primary bg-primary/5 text-contrast/75",
        tip: "border-secondary bg-secondary/5 text-contrast/75",
        warn: "border-warn bg-warn/5 text-contrast/75",
        danger: "border-danger bg-danger/5 text-contrast/75"
    };

    const icons = {
        info: "mi:circle-information",
        tip: "mi:check",
        warn: "ooui:alert",
        danger: "ooui:alert"
    };

    const tone = computed(() => tones[props.type] ?? tones.info);

    const icon = computed(() => icons[props.type] ?? icons.info);
</script>