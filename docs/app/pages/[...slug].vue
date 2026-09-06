<template>
    <article class="flex min-w-0 grow flex-col gap-10 px-6 py-12 lg:px-10">
        <header class="flex flex-col gap-2 border-b border-contrast/10 pb-6">
            <div class="flex flex-row flex-wrap items-baseline gap-3">
                <h1
                    class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold tracking-tight text-transparent"
                >
                    {{ page?.title }}
                </h1>
                <code
                    v-if="page?.tag"
                    class="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-medium text-primary"
                >
                    {{ page.tag }}
                </code>
            </div>

            <p
                v-if="page?.description"
                class="max-w-prose text-contrast/60"
            >
                {{ page.description }}
            </p>
        </header>

        <ContentRenderer
            v-if="page"
            :value="page"
            class="prose"
        />

        <p
            v-else
            class="text-contrast/50"
        >
            {{ $t("nav.notFound") }}
        </p>
    </article>
</template>

<script setup lang="ts">
    /**
     * A página do site inteiro: resolve a collection pelo locale e cai no pack de
     * referência quando a tradução ainda não existe — uma página faltando em `en`
     * mostra o texto em `pt`, e não um 404.
     */
    import { collectionOf } from "~/utils/content";

    const route = useRoute();

    const { locale } = useI18n();

    // A rota chega prefixada (`/pt/fields/text`); o caminho do conteúdo, não.
    const path = computed(() => route.path.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/");

    const { data: page } = await useAsyncData(
        () => `page-${locale.value}-${path.value}`,
        async () => {
            const own = await queryCollection(collectionOf(locale.value)).path(path.value).first();

            return own ?? (await queryCollection("content_pt").path(path.value).first());
        },
        { watch: [locale, path] }
    );

    useHead(() => ({
        title: page.value?.title ? `${page.value.title} · rform` : "rform"
    }));
</script>