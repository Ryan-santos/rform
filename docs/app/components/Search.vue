<template>
    <button
        type="button"
        class="flex w-full max-w-md cursor-pointer flex-row items-center gap-2 rounded-lg border border-contrast/10 bg-background-50 px-3 py-2 text-sm text-contrast/40 transition-colors hover:border-contrast/25 hover:text-contrast/70"
        @click="show"
    >
        <Icon
            name="mi:search"
            class="size-4 flex-none"
        />

        <span class="truncate">{{ $t("nav.search") }}</span>

        <kbd
            class="ml-auto hidden flex-none rounded-md border border-contrast/10 px-1.5 py-0.5 font-mono text-[0.625rem] text-contrast/35 sm:block"
        >
            ctrl k
        </kbd>
    </button>

    <Teleport to="body">
        <div
            v-if="open"
            class="fixed inset-0 z-50 flex flex-col items-center bg-dark/50 p-4 pt-20 backdrop-blur-sm"
            @click.self="open = false"
        >
            <div
                class="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-contrast/10 bg-background shadow-2xl shadow-dark/20"
            >
                <div
                    class="flex flex-none flex-row items-center gap-3 border-b border-contrast/10 px-4"
                >
                    <Icon
                        name="mi:search"
                        class="size-4 flex-none text-contrast/30"
                    />

                    <input
                        ref="field"
                        v-model="term"
                        type="search"
                        :placeholder="$t('nav.searchPlaceholder')"
                        class="grow bg-transparent py-4 text-sm outline-none placeholder:text-contrast/30"
                        @keydown.down.prevent="move(1)"
                        @keydown.up.prevent="move(-1)"
                        @keydown.enter.prevent="go(hits[active])"
                        @keydown.esc="open = false"
                    />

                    <kbd
                        class="flex-none rounded-md border border-contrast/10 px-1.5 py-0.5 font-mono text-[0.625rem] text-contrast/35"
                    >
                        esc
                    </kbd>
                </div>

                <ul
                    v-if="hits.length"
                    class="flex min-h-0 flex-col gap-1 overflow-y-auto p-2"
                >
                    <li
                        v-for="(hit, index) in hits"
                        :key="hit.id"
                    >
                        <NuxtLink
                            :to="href(hit)"
                            class="flex flex-col gap-1 rounded-xl px-3 py-2.5 transition-colors"
                            :class="
                                index === active ? 'bg-background-100' : 'hover:bg-background-50'
                            "
                            @click="open = false"
                            @mouseenter="active = index"
                        >
                            <span class="flex flex-row items-baseline gap-2">
                                <span class="text-sm font-medium">{{ hit.title }}</span>

                                <span class="truncate font-mono text-xs text-contrast/30">
                                    {{ hit.titles.join(" › ") }}
                                </span>
                            </span>

                            <span class="line-clamp-2 text-xs leading-relaxed text-contrast/50">
                                {{ hit.snippet }}
                            </span>
                        </NuxtLink>
                    </li>
                </ul>

                <p
                    v-else-if="term.trim()"
                    class="px-4 py-6 text-sm text-contrast/40"
                >
                    {{ $t("nav.empty", { filter: term.trim() }) }}
                </p>

                <p
                    v-else
                    class="px-4 py-6 text-sm text-contrast/40"
                >
                    {{ $t("nav.searchHint") }}
                </p>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
    /**
     * A busca do cabeçalho: procura no **texto** das páginas, não na barra lateral.
     * As seções vêm do `queryCollectionSearchSections()`, buscadas na primeira vez
     * que o painel abre — é payload que uma visita que nunca busca não paga.
     */
    import {
        computed,
        nextTick,
        onBeforeUnmount,
        onMounted,
        ref,
        useTemplateRef,
        watch
    } from "vue";

    import { collectionOf } from "~/utils/content";
    import { searchDocs, type Hit, type Section } from "~/utils/search";

    const { locale } = useI18n();

    const localePath = useLocalePath();

    const open = ref(false);

    const term = ref("");

    const active = ref(0);

    const field = useTemplateRef<HTMLInputElement>("field");

    const { data: sections, execute } = await useLazyAsyncData(
        () => `search-${locale.value}`,
        () => queryCollectionSearchSections(collectionOf(locale.value)),
        { immediate: false, watch: [locale], default: (): Section[] => [] }
    );

    const hits = computed(() => searchDocs(sections.value ?? [], term.value));

    const show = async () => {
        open.value = true;

        await execute();
        await nextTick();

        field.value?.focus();
    };

    const move = (step: number) => {
        const total = hits.value.length;

        if (total > 0) {
            active.value = (active.value + step + total) % total;
        }
    };

    // O caminho da collection não tem prefixo de idioma, e a âncora não passa pelo
    // `localePath` — daí o corte antes de montar o destino.
    const href = (hit: Hit) => {
        const [path, hash] = hit.id.split("#");

        return `${localePath(path || "/")}${hash ? `#${hash}` : ""}`;
    };

    const go = (hit?: Hit) => {
        if (hit) {
            open.value = false;

            navigateTo(href(hit));
        }
    };

    watch(term, () => (active.value = 0));

    const shortcut = (event: KeyboardEvent) => {
        if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();

            void show();
        }
    };

    onMounted(() => document.addEventListener("keydown", shortcut));

    onBeforeUnmount(() => document.removeEventListener("keydown", shortcut));
</script>