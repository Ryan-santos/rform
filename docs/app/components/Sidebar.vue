<template>
    <nav class="flex flex-col gap-7 py-8 pr-4 text-sm">
        <section
            v-for="group in groups"
            :key="group.path"
            class="flex flex-col gap-2"
        >
            <h2 class="px-4 text-sm font-semibold tracking-tight">
                {{ group.title }}
            </h2>

            <ul class="flex flex-col border-l border-contrast/10">
                <li
                    v-for="item in group.children"
                    :key="item.path"
                >
                    <NuxtLink
                        :to="localePath(item.path)"
                        class="-ml-px flex flex-row items-baseline justify-between gap-2 border-l py-1.5 pr-2 pl-4 transition-colors"
                        :class="
                            current === item.path
                                ? 'border-primary font-medium text-primary'
                                : 'border-transparent text-contrast/60 hover:border-contrast/30 hover:text-contrast'
                        "
                    >
                        {{ item.title }}

                        <code
                            v-if="item.tag"
                            class="font-mono text-xs"
                            :class="current === item.path ? 'text-primary/60' : 'text-contrast/25'"
                            >{{ item.tag }}</code
                        >
                    </NuxtLink>
                </li>
            </ul>
        </section>

        <p
            v-if="groups.length === 0"
            class="px-4 text-contrast/40"
        >
            {{ $t("nav.empty", { filter }) }}
        </p>
    </nav>
</template>

<script setup lang="ts">
    /**
     * A navegação da barra lateral. A ordem sai dos prefixos numéricos dos arquivos
     * de conteúdo, pelo `queryCollectionNavigation()` — não há segunda lista a
     * manter. O filtro vem do campo de busca da barra do topo.
     */
    import { computed } from "vue";

    import { currentPath } from "~/utils/content";

    const route = useRoute();

    const localePath = useLocalePath();

    const filter = useState("docs-filter", () => "");

    const { data: tree } = await useDocsNav();

    const current = computed(() => currentPath(route.path));

    const groups = computed(() => {
        const term = filter.value.trim().toLowerCase();

        const all = (tree.value ?? []).filter((group) => group.children?.length);

        if (!term) {
            return all;
        }

        return all
            .map((group) => ({
                ...group,
                children: (group.children ?? []).filter(
                    (item) =>
                        item.title?.toLowerCase().includes(term) ||
                        String(item.tag ?? "")
                            .toLowerCase()
                            .includes(term)
                )
            }))
            .filter((group) => group.children.length > 0);
    });
</script>