<template>
    <section class="flex flex-col gap-12 px-6 py-12 lg:px-10">
        <header class="flex flex-col gap-3 border-b border-contrast/10 pb-8">
            <h1
                class="w-fit bg-gradient-to-r from-primary to-secondary bg-clip-text pb-1 text-4xl font-bold tracking-tight text-transparent"
            >
                rform
            </h1>
            <p class="max-w-prose text-contrast/60">
                Playground do módulo. Cada página isola um componente e mostra o que cada prop faz,
                com o código real do exemplo recortado do próprio arquivo da página e o model saindo
                em JSON ao lado. No fim de cada página de campo há a seção
                <code class="font-mono">ui</code>, com as camadas do componente e o estilo que vem
                por padrão.
            </p>
        </header>

        <div
            v-for="group in nav"
            :key="group.title"
            class="flex flex-col gap-3"
        >
            <h2
                class="flex flex-row items-center gap-2 text-xs font-bold tracking-widest text-contrast/40 uppercase"
            >
                <span class="h-1 w-1 rounded-full bg-secondary" />
                {{ group.title }}
            </h2>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                <NuxtLink
                    v-for="item in group.items"
                    :key="item.to"
                    :to="item.to"
                    class="group flex flex-col gap-1 rounded-xl border border-contrast/10 bg-background-50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10 hover:text-primary hover:shadow-md hover:shadow-primary/10"
                >
                    <span class="font-medium">{{ item.label }}</span>
                    <code
                        class="font-mono text-xs text-contrast/40 transition-colors group-hover:text-secondary"
                        >{{ item.tag }}</code
                    >
                </NuxtLink>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
    import { nav } from "~/utils/nav";
</script>