<template>
    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Card :title="title">
            <slot />
        </Card>

        <Json
            :value="value"
            class="lg:sticky lg:top-6"
        />
    </div>
</template>

<script setup lang="ts">
    /**
     * O par de todo cenário: o formulário à esquerda, o model vivo à direita.
     */
    withDefaults(
        defineProps<{
            title?: string;
            value: unknown;
        }>(),
        { title: undefined }
    );
</script>