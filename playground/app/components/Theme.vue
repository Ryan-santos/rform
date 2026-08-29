<template>
    <button
        class="group relative size-7 overflow-hidden rounded-lg bg-neutral text-white transition-all duration-500 hover:!bg-primary hover:!text-white dark:bg-white dark:text-neutral"
        @click="toggle"
    >
        <span class="absolute left-1/2 top-1/2 z-10 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-[0.1875rem] border-neutral bg-current group-hover:!border-primary dark:size-5 dark:border dark:border-current" />
        <span class="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-3xl dark:rotate-45 dark:scale-95">
            <span
                v-for="key in 4"
                :key
                class="relative block h-0.5 w-5 rounded-sm bg-current"
            />
        </span>
        <span class="absolute right-0.5 top-0.5 z-10 size-0 rounded-full bg-neutral group-hover:!bg-primary dark:size-3.5 dark:bg-white" />
    </button>
</template>

<script setup lang="ts">
    const colorMode = useColorMode();

    const toggle = () => {
        colorMode.preference = colorMode.preference === "dark" ? "light" : "dark";
    };
</script>

<style scoped>
    button > :nth-child(1) {
        transition: width .4s, height .4s, border .4s, background-color .4s !important;
    }

    button > :nth-child(3) {
        transition: width .5s, height .6s, background-color .5s !important;
        transition-delay: .08s;
    }

    button > :nth-child(2) {
        transition: rotate .4s, scale .4s !important;
    }

    button > :nth-child(2) span {
        transition: background-color .4s !important;
    }

    button > :nth-child(2) > :nth-child(1) {
        top: calc(50% - 1px);
    }

    button > :nth-child(2) > :nth-child(2) {
        top: calc(50% - 3px);
        transform: rotate(90deg);
    }

    button > :nth-child(2) > :nth-child(3) {
        top: calc(50% - 5px);
        transform: rotate(45deg);
    }

    button > :nth-child(2) > :nth-child(4) {
        top: calc(50% - 7px);
        transform: rotate(-45deg);
    }
</style>