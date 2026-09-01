<template>
    <div class="flex flex-row flex-wrap gap-2 pt-2">
        <button
            type="submit"
            class="
                cursor-pointer rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2
                text-sm font-medium text-white shadow-sm shadow-primary/30 transition-all
                duration-300
                hover:shadow-md hover:shadow-secondary/30
            "
        >
            {{ submitText }}
        </button>
        <button
            type="reset"
            class="
                cursor-pointer rounded-lg border border-contrast/10 px-4 py-2 text-sm
                transition-all duration-300
                hover:border-secondary hover:text-secondary
            "
        >
            reset
        </button>
    </div>
</template>

<script setup lang="ts">
    withDefaults(defineProps<{
        submitText?: string
    }>(), {
        submitText: "submit (roda as rules)"
    });
</script>
