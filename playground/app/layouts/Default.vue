<template>
    <div class="flex flex-row">
        <button
            type="button"
            class="
                fixed top-4 left-4 z-50 rounded-lg bg-gradient-to-r from-primary to-secondary
                px-3 py-2 text-sm leading-none text-white shadow-sm shadow-primary/30
                lg:hidden
            "
            @click="open = !open"
        >
            {{ open ? "fechar" : "menu" }}
        </button>

        <div
            v-if="open"
            class="
                fixed inset-0 z-30 bg-dark/50
                lg:hidden
            "
            @click="open = false"
        />

        <aside
            class="
                fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r
                border-contrast/10 bg-background-50 transition-transform duration-300
                lg:translate-x-0
            "
            :class="open ? 'translate-x-0' : '-translate-x-full'"
        >
            <NuxtLink
                to="/"
                class="
                    flex flex-row items-baseline gap-2 px-5 pt-5 pb-4 transition-opacity
                    hover:opacity-80
                "
            >
                <span
                    class="
                        bg-gradient-to-r from-primary to-secondary bg-clip-text pb-0.5 text-2xl
                        leading-tight font-bold tracking-tight text-transparent
                    "
                >rform</span>
                <span class="text-xs text-contrast/40">playground</span>
            </NuxtLink>

            <div class="px-5 pb-4">
                <input
                    v-model="filter"
                    type="search"
                    placeholder="filtrar…"
                    class="
                        w-full rounded-lg border border-primary/10 bg-background-100 px-3 py-2
                        text-sm outline-2 outline-transparent transition-all duration-300
                        focus:border-transparent focus:outline-primary
                    "
                />
            </div>

            <!--
                O `pt-5` é o que salva o primeiro título: a máscara apaga o primeiro
                1rem do scroll, e sem folga o “Formulário” nascia cortado nela.
            -->
            <nav class="mask-transparent-border-y flex grow flex-col gap-5 overflow-y-auto px-5 pt-5 pb-5">
                <section
                    v-for="group in groups"
                    :key="group.title"
                    class="flex flex-col gap-1"
                >
                    <h2
                        class="
                            flex flex-row items-center gap-2 px-2 pb-1 text-xs font-bold
                            tracking-widest text-contrast/40 uppercase
                        "
                    >
                        <span class="h-px grow-0 basis-3 bg-gradient-to-r from-primary to-secondary" />
                        {{ group.title }}
                    </h2>

                    <NuxtLink
                        v-for="item in group.items"
                        :key="item.to"
                        :to="item.to"
                        class="
                            relative flex flex-row items-baseline justify-between gap-2 rounded-lg
                            px-2 py-1.5 text-sm transition-all duration-300
                            hover:bg-primary/5 hover:text-primary
                        "
                        :class="route.path === item.to
                            ? 'bg-gradient-to-r from-primary/15 to-secondary/10 font-medium text-primary'
                            : 'text-contrast/70'"
                    >
                        <span
                            v-if="route.path === item.to"
                            class="absolute top-1.5 bottom-1.5 -left-px w-0.5 rounded-full bg-primary"
                        />
                        {{ item.label }}
                        <code
                            class="font-mono text-xs transition-colors"
                            :class="route.path === item.to ? 'text-secondary' : 'text-contrast/30'"
                        >{{ item.tag }}</code>
                    </NuxtLink>
                </section>

                <p
                    v-if="groups.length === 0"
                    class="px-2 text-sm text-contrast/40"
                >
                    nada com “{{ filter }}”.
                </p>
            </nav>

            <div class="flex flex-row items-center justify-between border-t border-contrast/10 px-5 py-4">
                <span class="text-xs text-contrast/40">tema</span>
                <Theme />
            </div>
        </aside>

        <main
            class="
                flex min-h-screen w-full min-w-0 flex-col
                lg:pl-64
            "
        >
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from "vue";
    import { nav } from "~/utils/nav";

    const route = useRoute();

    const open = ref(false);

    const filter = ref("");

    watch(() => route.path, () => (open.value = false));

    const groups = computed(() => {
        const term = filter.value.trim().toLowerCase();

        if (!term) {
            return nav;
        }

        return nav
            .map(group => ({
                ...group,
                items: group.items.filter(item =>
                    item.label.toLowerCase().includes(term)
                    || item.tag.toLowerCase().includes(term))
            }))
            .filter(group => group.items.length > 0);
    });
</script>
