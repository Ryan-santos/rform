<template>
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-6">
        <header class="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <h1 class="font-mono text-sm font-bold">
                rform <span class="text-primary">·</span> ui
            </h1>

            <nav class="flex flex-row flex-wrap gap-1">
                <NuxtLink
                    v-for="item in pages"
                    :key="item.path"
                    :to="item.path"
                    class="rounded-lg px-2 py-1 font-mono text-xs transition-colors"
                    :class="
                        route.path === item.path
                            ? 'bg-primary/10 text-primary'
                            : 'text-contrast/40 hover:text-primary'
                    "
                >
                    {{ item.name }}
                </NuxtLink>
            </nav>

            <div class="ml-auto flex flex-row items-center gap-2">
                <Theme />
            </div>
        </header>

        <slot />
    </div>
</template>

<script setup lang="ts">
    const route = useRoute();

    // Derivada da tabela de rotas: uma página nova aparece sozinha, sem lista a
    // atualizar.
    const pages = useRouter()
        .getRoutes()
        .filter((item) => !item.path.includes(":"))
        .map((item) => ({
            path: item.path,
            name: item.path === "/" ? "index" : item.path.slice(1)
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
</script>