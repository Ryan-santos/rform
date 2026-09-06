<template>
    <nav
        v-if="flat.length"
        class="flex flex-col gap-3 py-8 pr-4 text-sm"
    >
        <p class="text-xs font-bold tracking-widest text-contrast/40 uppercase">
            {{ $t("nav.onThisPage") }}
        </p>

        <ul class="flex flex-col border-l border-contrast/10">
            <li
                v-for="link in flat"
                :key="link.id"
            >
                <a
                    :href="`#${link.id}`"
                    class="-ml-px block border-l py-1 transition-colors"
                    :class="[
                        link.depth > 2 ? 'pl-7' : 'pl-4',
                        active === link.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-contrast/50 hover:text-contrast'
                    ]"
                >
                    {{ link.text }}
                </a>
            </li>
        </ul>
    </nav>
</template>

<script setup lang="ts">
    /**
     * O índice da página, à direita. O item ativo sai de um `IntersectionObserver`
     * sobre os próprios títulos: `scrollspy` por evento de scroll refaz layout a
     * cada quadro, e aqui o que se quer saber é só quem cruzou o topo.
     */
    import { computed, onBeforeUnmount, ref, watch } from "vue";

    type TocLink = {
        id: string;
        text: string;
        depth: number;
        children?: TocLink[];
    };

    const props = defineProps<{
        links?: TocLink[];
    }>();

    const flat = computed(() =>
        (props.links ?? []).flatMap((link) => [link, ...(link.children ?? [])])
    );

    const active = ref("");

    let observer: IntersectionObserver | undefined;

    const observe = () => {
        observer?.disconnect();

        if (!import.meta.client || !flat.value.length) {
            return;
        }

        // A faixa é o topo da área de leitura: entra quando cruza o cabeçalho e
        // sai quando passa da metade da tela.
        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        active.value = entry.target.id;
                    }
                }
            },
            { rootMargin: "-72px 0px -55% 0px" }
        );

        for (const link of flat.value) {
            const node = document.getElementById(link.id);

            if (node) {
                observer.observe(node);
            }
        }
    };

    watch(flat, () => requestAnimationFrame(observe), { immediate: import.meta.client });

    onBeforeUnmount(() => observer?.disconnect());
</script>