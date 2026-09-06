<template>
    <Menu
        data-allow-mismatch
        :icon="current.icon"
        :label="$t('nav.theme')"
    >
        <template #default="{ close }">
            <button
                v-for="option in options"
                :key="option.id"
                type="button"
                class="flex cursor-pointer flex-row items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-background-100"
                :class="colorMode.preference === option.id ? 'text-primary' : 'text-contrast/70'"
                @click="
                    colorMode.preference = option.id;
                    close();
                "
            >
                <Icon
                    :name="option.icon"
                    class="size-4 flex-none"
                />

                {{ $t(option.label) }}

                <Icon
                    v-if="colorMode.preference === option.id"
                    name="mi:check"
                    class="ml-auto size-3.5 flex-none"
                />
            </button>
        </template>
    </Menu>
</template>

<script setup lang="ts">
    /**
     * Seletor de tema do site: claro, escuro ou o do sistema. Só o ícone aparece no
     * cabeçalho — o do tema em vigor.
     */
    import { computed } from "vue";

    const colorMode = useColorMode();

    // `system` é opção de verdade, não estado escondido: um toggle de duas posições,
    // uma vez tocado, nunca mais devolvia a escolha ao sistema operacional.
    const options = [
        { id: "light", icon: "mi:sun", label: "nav.light" },
        { id: "dark", icon: "mi:moon", label: "nav.dark" },
        { id: "system", icon: "mi:computer", label: "nav.system" }
    ];

    const current = computed(
        () => options.find((option) => option.id === colorMode.preference) ?? options[2]!
    );
</script>