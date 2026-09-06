<template>
    <div class="flex min-h-screen flex-col">
        <Header />

        <div
            v-if="menu"
            class="fixed inset-0 top-16 z-30 bg-dark/40 lg:hidden"
            @click="menu = false"
        />

        <div class="mx-auto flex w-full max-w-[100rem] flex-row items-start px-4 lg:px-6">
            <aside
                class="fixed bottom-0 left-0 top-16 z-40 w-72 overflow-y-auto border-r border-contrast/10 bg-background px-4 transition-transform duration-300 lg:sticky lg:z-0 lg:h-[calc(100vh-4rem)] lg:w-60 lg:flex-none lg:translate-x-0 lg:border-r-0 lg:px-0"
                :class="menu ? 'translate-x-0' : '-translate-x-full'"
            >
                <Sidebar />
            </aside>

            <main class="flex min-w-0 grow flex-row items-start">
                <slot />
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
    /**
     * O chassi do site: barra do topo, navegação à esquerda e a página no meio —
     * ela é que decide se tem índice à direita.
     */
    import { watch } from "vue";

    const route = useRoute();

    const menu = useState("docs-menu", () => false);

    watch(
        () => route.path,
        () => (menu.value = false)
    );
</script>