<template>
    <div class="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <header class="flex flex-col gap-3 border-b border-contrast/10 pb-6">
            <div class="flex flex-row flex-wrap items-baseline justify-between gap-3">
                <h1 class="text-2xl font-bold tracking-tight">
                    rform <span class="text-primary">·</span> ui
                </h1>
                <Theme />
            </div>

            <p class="max-w-prose text-sm text-contrast/60">
                Tokens --rf-*, defineFieldDefaults e ui por campo. Sem i18n de propósito: aqui o
                assunto é aparência, e chave de tradução seria ruído.
            </p>

            <nav class="flex flex-row flex-wrap gap-2">
                <NuxtLink
                    v-for="item in pages"
                    :key="item.path"
                    :to="item.path"
                    class="rounded-lg border border-contrast/10 px-3 py-1.5 text-sm transition-colors"
                    :class="
                        route.path === item.path
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'text-contrast/60 hover:border-primary/40 hover:text-primary'
                    "
                >
                    {{ item.name }}
                </NuxtLink>
            </nav>
        </header>

        <slot />
    </div>
</template>

<script setup lang="ts">
    const route = useRoute();

    // Derivada da tabela de rotas: um playground é rascunho, e uma lista escrita à
    // mão seria mais uma coisa a esquecer de atualizar ao criar uma página.
    const pages = useRouter()
        .getRoutes()
        .filter((item) => !item.path.includes(":"))
        .map((item) => ({
            path: item.path,
            name: item.path === "/" ? "index" : item.path.slice(1)
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
</script>