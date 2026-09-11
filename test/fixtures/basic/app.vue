<template>
    <div>
        <h1>rform fixture</h1>
        <RForm v-model="data">
            <RText
                name="name"
                data-testid="name-input"
            />
            <p data-testid="name-value">name={{ displayName(data) }}</p>
            <RSelect
                name="color"
                :options="['red', 'green']"
                data-testid="color-select"
            />
        </RForm>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const data = ref<Record<string, unknown>>({});

    function displayName(model: Record<string, unknown>): string {
        return String(model?.name ?? "");
    }
</script>