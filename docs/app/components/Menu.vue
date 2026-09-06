<template>
    <div
        ref="root"
        class="relative"
    >
        <button
            type="button"
            :aria-label="label"
            :title="label"
            :aria-expanded="open"
            class="flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-background-100 hover:text-contrast"
            :class="open ? 'bg-background-100 text-contrast' : 'text-contrast/50'"
            @click="open = !open"
        >
            <Icon
                :name="icon"
                class="size-4.5"
            />
        </button>

        <div
            v-if="open"
            class="absolute top-full right-0 z-50 mt-2 flex min-w-44 flex-col gap-0.5 rounded-xl border border-contrast/10 bg-background p-1 shadow-lg shadow-dark/10"
        >
            <slot :close="close" />
        </div>
    </div>
</template>

<script setup lang="ts">
    /**
     * O botão de ícone que abre um menu — é o que o tema e o idioma viraram no
     * cabeçalho. Fecha no clique fora, no `Escape` e na escolha, via o `close` do
     * slot.
     */
    import { onBeforeUnmount, onMounted, ref } from "vue";

    defineProps<{
        icon: string;
        label: string;
    }>();

    const root = ref<HTMLElement | null>(null);

    const open = ref(false);

    const close = () => (open.value = false);

    // O `pointerdown` do documento, e não um overlay: um overlay engoliria o clique
    // que abre o outro menu ao lado.
    const outside = (event: PointerEvent) => {
        if (open.value && !root.value?.contains(event.target as Node)) {
            close();
        }
    };

    const escape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            close();
        }
    };

    onMounted(() => {
        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);
    });

    onBeforeUnmount(() => {
        document.removeEventListener("pointerdown", outside);
        document.removeEventListener("keydown", escape);
    });
</script>