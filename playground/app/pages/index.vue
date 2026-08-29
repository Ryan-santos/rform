<template>
    <section>
        <NuxtLink href="/form">
            form
        </NuxtLink>
        <NuxtLink href="/dynamic">
            dynamic (useRForm)
        </NuxtLink>
        <div>
            <div
                v-for="color in ['background', 'contrast', 'primary', 'success', 'warning', 'error']"
                :key="color"
                class="flex flex-row gap-6"
            >
                <div
                    v-for="variant in [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900]"
                    :key="variant"
                    class="size-16 rounded-2xl transition-colors flex justify-center items-center"
                    :style="`background-color: var(--color-${color}${variant ? `-${variant}` : ''})`"
                >
                    {{ variant }}
                </div>
            </div>
        </div>
    </section>
</template>