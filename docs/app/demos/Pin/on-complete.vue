<template>
    <RPin
        name="comCallback"
        label="demo.pin.preenchaAteOFim"
        :length="4"
        @complete="onComplete"
    />
    <p
        v-if="completedAt"
        class="text-sm text-success"
    >
        {{ $t("demo.pin.disparou", { at: completedAt, value: completedValue }) }}
    </p>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const completedAt = ref("");

    const completedValue = ref("");

    const onComplete = (value: string) => {
        completedValue.value = value;
        completedAt.value = new Date().toLocaleTimeString();
    };
</script>