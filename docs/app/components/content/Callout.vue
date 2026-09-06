<template>
    <aside
        class="flex flex-row gap-3 rounded-xl border border-l-4 p-4 text-sm leading-relaxed [&_code]:rounded-md [&_code]:bg-current/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-current!"
        :class="tone.box"
    >
        <Icon
            :name="tone.icon"
            class="mt-0.5 size-4.5 flex-none"
            :class="tone.mark"
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
     *
     * Só a barra da esquerda e o ícone levam a cor: o texto fica no contraste
     * normal, senão um aviso longo vira um parágrafo colorido inteiro.
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
        info: {
            box: "border-primary/20 border-l-primary bg-primary/[0.06] text-contrast/80",
            mark: "text-primary",
            icon: "mi:circle-information"
        },
        tip: {
            box: "border-secondary/20 border-l-secondary bg-secondary/[0.06] text-contrast/80",
            mark: "text-secondary",
            icon: "mi:circle-check"
        },
        warn: {
            box: "border-warn/20 border-l-warn bg-warn/[0.06] text-contrast/80",
            mark: "text-warn",
            icon: "mi:warning"
        },
        danger: {
            box: "border-danger/20 border-l-danger bg-danger/[0.06] text-contrast/80",
            mark: "text-danger",
            icon: "mi:circle-warning"
        }
    };

    const tone = computed(() => tones[props.type] ?? tones.info);
</script>