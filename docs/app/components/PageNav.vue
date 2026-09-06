<template>
    <nav
        v-if="previous || next"
        class="grid gap-3 border-t border-contrast/10 pt-6 sm:grid-cols-2"
    >
        <NuxtLink
            v-if="previous"
            :to="localePath(previous.path)"
            class="group flex flex-col gap-1 rounded-xl border border-contrast/10 px-4 py-3 transition-colors hover:border-primary/40"
        >
            <span class="text-xs text-contrast/40">{{ $t("nav.previous") }}</span>
            <span class="text-sm font-medium transition-colors group-hover:text-primary">
                {{ previous.title }}
            </span>
        </NuxtLink>

        <span v-else />

        <NuxtLink
            v-if="next"
            :to="localePath(next.path)"
            class="group flex flex-col items-end gap-1 rounded-xl border border-contrast/10 px-4 py-3 text-right transition-colors hover:border-primary/40 sm:col-start-2"
        >
            <span class="text-xs text-contrast/40">{{ $t("nav.next") }}</span>
            <span class="text-sm font-medium transition-colors group-hover:text-primary">
                {{ next.title }}
            </span>
        </NuxtLink>
    </nav>
</template>

<script setup lang="ts">
    /**
     * Anterior e próxima, na ordem da barra lateral. Lê o mesmo `useAsyncData` da
     * navegação — a chave é a mesma, então não há segunda consulta.
     */
    import { computed } from "vue";

    import { currentPath, flattenNav, type NavItem } from "~/utils/content";

    const route = useRoute();

    const localePath = useLocalePath();

    const { data: tree } = await useDocsNav();

    const pages = computed(() => flattenNav((tree.value ?? []) as NavItem[]));

    const index = computed(() =>
        pages.value.findIndex((page) => page.path === currentPath(route.path))
    );

    const previous = computed(() => (index.value > 0 ? pages.value[index.value - 1] : undefined));

    const next = computed(() => (index.value >= 0 ? pages.value[index.value + 1] : undefined));
</script>