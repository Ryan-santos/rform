<template>
    <header
        class="sticky top-0 z-40 h-16 flex-none border-b border-contrast/15 bg-background/85 backdrop-blur"
    >
        <div class="mx-auto flex h-full max-w-[100rem] flex-row items-center gap-3 px-4 lg:px-6">
            <div class="flex flex-none flex-row items-center gap-3 lg:w-60">
                <button
                    type="button"
                    :aria-label="$t('nav.menu')"
                    class="-ml-1 flex size-9 cursor-pointer items-center justify-center rounded-lg text-contrast/60 transition-colors hover:bg-background-100 hover:text-contrast lg:hidden"
                    @click="menu = !menu"
                >
                    <Icon
                        :name="menu ? 'mi:close' : 'mi:menu'"
                        class="size-4.5"
                    />
                </button>

                <NuxtLink
                    :to="localePath('/')"
                    class="flex flex-row items-baseline gap-2 transition-opacity hover:opacity-70"
                >
                    <span class="text-xl leading-none font-bold tracking-tight">RForm</span>
                    <span class="hidden text-xs text-contrast/40 sm:inline">{{
                        $t("nav.docs")
                    }}</span>
                </NuxtLink>
            </div>

            <div class="flex min-w-0 grow flex-row justify-center">
                <Search />
            </div>

            <div class="flex flex-none flex-row items-center gap-1">
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
        </div>
    </header>
</template>

<script setup lang="ts">
    /**
     * A barra do topo: marca à esquerda, busca no centro, e à direita o GitHub e os
     * dois menus de ícone.
     *
     * O menu do mobile mora em `useState` porque quem o consome é a barra lateral,
     * do outro lado do layout.
     */
    const localePath = useLocalePath();

    const menu = useState("docs-menu", () => false);

    const repository = "https://github.com/Ryan-santos/nuxt-rform";
</script>