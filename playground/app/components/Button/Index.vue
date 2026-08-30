<template>
    <component
        :is="href ? NuxtLink : 'button'"
        ref="button"
        :href="href"
        class="
            group/button
            inline-flex
            select-none
            flex-row
            items-center
            justify-center
            gap-2
            overflow-hidden
            rounded-full
            border
            border-transparent
            text-center
            font-medium
            tracking-wide
            !transition-all

            !duration-500

            disabled:pointer-events-none
            disabled:cursor-not-allowed

            activated:cursor-not-allowed
            activated:shadow-none
        "
        :class="[
            _color,
            _size,
            {'activated': props.activated || _loading}
        ]"
        :disabled="_loading"
        @click="click"
    >
        <TransitionTranslateY>
            <Icon v-if="_loading" name="loading" class="pointer-events-none" />
            <span v-else class="pointer-events-none inline-flex w-full items-center justify-center gap-2" :class="props.addClass">
                <slot />
            </span>
        </TransitionTranslateY>
    </component>
</template>

<script setup lang="ts">
    import { NuxtLink } from "#components";

    const base = /* @tw */ {
        solid: "shadow",
        outline: "outline outline-2 shadow hovact:outline-transparent",
        transparent: "bg-transparent"
    };

    const colors = /* @tw */ {
        primary: {
            solid: "bg-primary text-white",
            outline: "outline-primary text-primary",
            transparent: "",
            hovact: "hovact:bg-contrast hovact:text-primary hovact:border-primary hover:shadow-primary"
        },
        secondary: {
            solid: "bg-secondary text-white",
            outline: "outline-secondary text-secondary",
            transparent: "text-secondary",
            hovact: "hovact:bg-contrast hovact:text-secondary hovact:border-secondary hover:shadow-secondary"
        },
        tertiary: {
            solid: "bg-tertiary text-white",
            outline: "outline-tertiary text-tertiary",
            transparent: "text-tertiary",
            hovact: "hovact:bg-white hovact:text-tertiary hovact:border-tertiary hover:shadow-tertiary"
        },
        quarter: {
            solid: "bg-quarter text-black",
            outline: "outline-quarter text-quarter",
            transparent: "text-quarter",
            hovact: "hovact:bg-black hovact:text-quarter hovact:border-quarter hover:shadow-quarter"
        },
        contrast: {
            solid: "bg-contrast text-background",
            outline: "outline-contrast",
            transparent: "text-contrast",
            hovact: "hovact:bg-background hovact:text-contrast hovact:border-contrast hover:shadow-contrast"
        },
        background: {
            solid: "bg-background text-contrast",
            outline: "outline-background",
            transparent: "text-background",
            hovact: "color-background-auto hovact:bg-transparent hovact:text-primary hovact:border-primary hover:shadow-primary"
        },
        white: {
            solid: "bg-white text-black",
            outline: "outline-white text-white",
            transparent: "text-white",
            hovact: "hovact:bg-black hovact:text-white hovact:border-white hover:shadow-white"
        },
        black: {
            solid: "bg-black text-white",
            outline: "outline-black text-black",
            transparent: "text-black",
            hovact: "hovact:bg-white hovact:text-black hovact:border-black hover:shadow-black"
        },
        danger: {
            solid: "bg-danger text-white",
            outline: "outline-danger text-danger",
            transparent: "text-danger",
            hovact: "hovact:bg-white hovact:text-danger hovact:border-danger hover:shadow-danger"
        },
        warn: {
            solid: "bg-warn text-white",
            outline: "outline-warn text-warn",
            transparent: "text-warn",
            hovact: "hovact:bg-white hovact:text-warn hovact:border-warn hover:shadow-warn"
        },
        success: {
            solid: "bg-success text-white",
            outline: "outline-success text-success",
            transparent: "text-success",
            hovact: "hovact:bg-black hovact:text-success hovact:border-success hover:shadow-success"
        },
        custom: {
            solid: "",
            outline: "",
            transparent: "",
            hovact: "hovact:bg-contrast hovact:text-primary hovact:border-primary hover:shadow-primary"
        },
        customFul: {
            solid: "",
            outline: "",
            transparent: "",
            hovact: ""
        }
    } satisfies Record<keyof any, typeof base & { hovact: string }>;

    const sizes = /* @tw */ {
        sm: "p-1 hover:shadow-[3px_3px_0px]",
        md: "py-2 px-4 text-lg hover:shadow-[0.3125rem_0.3125rem_0rem]",
        lg: "py-3 px-6 text-xl hover:shadow-[0.3125rem_0.3125rem_0rem]"
    };

    export declare namespace Button {
        export type Color = keyof typeof colors
        export type Variant = keyof typeof base
        export type Size = keyof typeof sizes
    }

    const props = withDefaults(defineProps<{
        href?: string
        color?: Button.Color
        variant?: Button.Variant
        size?: Button.Size
        addClass?: string
        activated?: boolean
        loading?: boolean
        action?:() => Promise<any>
    }>(), {
        href: undefined,
        color: "primary",
        variant: "solid",
        size: "md",
        addClass: undefined,
        action: undefined
    });

    const emit = defineEmits<{
        finally: []
    }>();

    const _color = computed(() => {
        return `${base?.[props.variant]} ${colors[props.color]?.[props.variant]} ${colors[props.color].hovact}`;
    });

    const _size = computed(() => {
        return sizes[props.size];
    });

    const loadingAction = ref(false);

    const _loading = computed(() => {
        return props.loading || loadingAction.value;
    });

    const click = async () => {
        if (props.action) {
            loadingAction.value = true;

            await props.action()
                .finally(() => {
                    loadingAction.value = false;
                    emit("finally");
                });
        }
    };

    const button = ref<HTMLButtonElement>();

    onMounted(() => {
        // para evitar o redimensionamento do botão em modo loading
        watch(_loading, async (newValue) => {
            if (button.value) {
                const add = newValue ? `${button.value?.getBoundingClientRect().width}px` : "";

                if (!add) {
                    // um pequeno delay para o botão não tirar o width original antes da transição
                    await new Promise(resolve => setTimeout(resolve, 600));
                }

                button.value.style.width = add;
            }
        });
    });
</script>