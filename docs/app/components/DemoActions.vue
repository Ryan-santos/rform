<template>
    <div class="flex flex-row flex-wrap gap-2 pt-2">
        <button
            type="submit"
            class="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/85"
        >
            {{ submitText ?? $t("ui.submit") }}
        </button>
        <button
            type="reset"
            class="cursor-pointer rounded-lg border border-contrast/10 px-4 py-2 text-sm transition-all duration-300 hover:border-contrast/30 hover:text-contrast"
        >
            {{ $t("ui.reset") }}
        </button>
    </div>
</template>

<script setup lang="ts">
    /**
     * Os dois botões de um demo que valida: `submit` roda as rules do `RForm`,
     * `reset` devolve cada campo ao `default`.
     */
    withDefaults(
        defineProps<{
            submitText?: string;
        }>(),
        {
            submitText: undefined
        }
    );
</script>