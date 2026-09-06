<template>
    <div class="flex min-w-0 grow flex-row items-start">
        <article class="flex min-w-0 grow flex-col gap-8 py-10 lg:px-8 xl:px-10">
            <header class="flex flex-col gap-3">
                <p
                    v-if="section"
                    class="text-xs font-bold tracking-widest text-secondary uppercase"
                >
                    {{ section }}
                </p>

                <div class="flex flex-row flex-wrap items-baseline gap-3">
                    <h1 class="text-3xl font-bold tracking-tight">
                        {{ page?.title }}
                    </h1>

                    <code
                        v-if="page?.tag"
                        class="rounded-md bg-secondary/10 px-2 py-1 font-mono text-sm font-medium text-secondary"
                    >
                        {{ page.tag }}
                    </code>
                </div>

                <p
                    v-if="page?.description"
                    class="text-lg text-contrast/55"
                >
                    {{ page.description }}
                </p>
            </header>

            <hr />

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

            <PageNav />
        </article>

        <aside
            class="hidden w-56 flex-none xl:sticky xl:top-16 xl:block xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto"
        >
            <Toc :links="page?.body?.toc?.links" />
        </aside>
    </div>
</template>

<script setup lang="ts">
    /**
     * A página do site inteiro: resolve a collection pelo locale e cai no pack de
     * referência quando a tradução ainda não existe — uma página faltando em `en`
     * mostra o texto em `pt`, e não um 404.
     */
    import { collectionOf, currentPath, flattenNav, type NavItem } from "~/utils/content";

    const route = useRoute();

    const { locale } = useI18n();

    const path = computed(() => currentPath(route.path));

    const { data: page } = await useAsyncData(
        () => `page-${locale.value}-${path.value}`,
        async () => {
            const own = await queryCollection(collectionOf(locale.value)).path(path.value).first();

            return own ?? (await queryCollection("content_pt").path(path.value).first());
        },
        { watch: [locale, path] }
    );

    const { data: tree } = await useDocsNav();

    // O nome da seção a que a página pertence — o mesmo título que a barra lateral
    // mostra acima do grupo.
    const section = computed(
        () =>
            ((tree.value ?? []) as NavItem[]).find((group) =>
                flattenNav(group.children).some((item) => item.path === path.value)
            )?.title
    );

    useHead(() => ({
        title: page.value?.title ? `${page.value.title} · RForm` : "RForm"
    }));
</script>