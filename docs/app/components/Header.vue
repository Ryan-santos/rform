<template>
    <header
        class="sticky top-0 z-40 h-16 flex-none border-b border-contrast/10 bg-background/85 backdrop-blur"
    >
        <div class="mx-auto flex h-full max-w-[100rem] flex-row items-center gap-3 px-4 lg:px-6">
            <button
                type="button"
                :aria-label="$t('nav.menu')"
                class="-ml-1 flex size-9 cursor-pointer items-center justify-center rounded-lg text-contrast/60 transition-colors hover:bg-background-100 hover:text-contrast lg:hidden"
                @click="menu = !menu"
            >
                <svg
                    viewBox="0 0 24 24"
                    class="size-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                >
                    <path :d="menu ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'" />
                </svg>
            </button>

            <NuxtLink
                :to="localePath('/')"
                class="flex flex-row items-baseline gap-2 transition-opacity hover:opacity-70"
            >
                <span class="text-xl leading-none font-bold tracking-tight">rform</span>
                <span class="hidden text-xs text-contrast/40 sm:inline">{{ $t("nav.docs") }}</span>
            </NuxtLink>

            <div class="grow" />

            <label class="relative hidden w-56 flex-none md:block xl:w-72">
                <svg
                    viewBox="0 0 24 24"
                    class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-contrast/30"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                >
                    <circle
                        cx="11"
                        cy="11"
                        r="7"
                    />
                    <path d="m20 20-3.5-3.5" />
                </svg>

                <input
                    v-model="filter"
                    type="search"
                    :placeholder="$t('nav.filter')"
                    class="w-full rounded-lg border border-contrast/10 bg-background-50 py-2 pr-3 pl-9 text-sm outline-2 outline-transparent transition-colors focus:border-transparent focus:outline-primary"
                />
            </label>

            <a
                :href="repository"
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
                class="flex size-9 items-center justify-center rounded-lg text-contrast/50 transition-colors hover:bg-background-100 hover:text-contrast"
            >
                <svg
                    viewBox="0 0 16 16"
                    class="size-4.5"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                    />
                </svg>
            </a>

            <Theme />

            <Locale />
        </div>
    </header>
</template>

<script setup lang="ts">
    /**
     * A barra do topo: marca, busca da navegação, GitHub e os dois seletores.
     *
     * O filtro e o menu do mobile moram em `useState` porque quem os consome é a
     * barra lateral, do outro lado do layout.
     */
    const localePath = useLocalePath();

    const filter = useState("docs-filter", () => "");

    const menu = useState("docs-menu", () => false);

    const repository = "https://github.com/Ryan-santos/rform";
</script>