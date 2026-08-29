<template>
    <slot :reference="setReference" />

    <Transition
        :name="props.ui?.transition?.name"
        :enterActiveClass="props.ui?.transition?.enterActiveClass"
        :enterFromClass="props.ui?.transition?.enterFromClass"
        :enterToClass="props.ui?.transition?.enterToClass"
        :leaveActiveClass="props.ui?.transition?.leaveActiveClass"
        :leaveFromClass="props.ui?.transition?.leaveFromClass"
        :leaveToClass="props.ui?.transition?.leaveToClass"
    >
        <div
            v-show="open"
            ref="floating"
            v-bind="$attrs"
            :style="floatingStyles"
            :class="props.ui?.popover"
            @click.stop
        >
            <slot name="content" />
        </div>
    </Transition>
</template>

<script lang="ts">
    import {
        autoUpdate,
        flip,
        offset as offsetMiddleware,
        shift,
        useFloating,
        type Middleware,
        type Placement,
        type Strategy
    } from "@floating-ui/vue";
    import {
        computed,
        onMounted,
        onUnmounted,
        ref,
        useTemplateRef,
        watch,
        type ComponentPublicInstance
    } from "vue";

    import { useUtilProps } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";

    let lockCount = 0;
    const savedBody: {
        overflow: string
        paddingRight: string
        paddingLeft: string
        position: string
        top: string
        left: string
        width: string
        scrollX: number
        scrollY: number
        isIOS: boolean
    } = {
        overflow: "",
        paddingRight: "",
        paddingLeft: "",
        position: "",
        top: "",
        left: "",
        width: "",
        scrollX: 0,
        scrollY: 0,
        isIOS: false
    };

    const detectIOS = () => {
        if (typeof navigator === "undefined") {
            return false;
        }
        return (
            /iP(hone|ad|od)/.test(navigator.platform)
            || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform))
        );
    };

    const lockBodyScroll = () => {
        if (lockCount++ > 0) {
            return;
        }
        if (typeof document === "undefined") {
            return;
        }

        const body = document.body;
        const html = document.documentElement;

        savedBody.scrollX = window.scrollX;
        savedBody.scrollY = window.scrollY;
        savedBody.overflow = body.style.overflow;
        savedBody.paddingRight = body.style.paddingRight;
        savedBody.paddingLeft = body.style.paddingLeft;
        savedBody.isIOS = detectIOS();

        if (savedBody.isIOS) {
            savedBody.position = body.style.position;
            savedBody.top = body.style.top;
            savedBody.left = body.style.left;
            savedBody.width = body.style.width;
            body.style.position = "fixed";
            body.style.top = `-${savedBody.scrollY}px`;
            body.style.left = `-${savedBody.scrollX}px`;
            body.style.width = "100%";
            return;
        }

        const scrollbarWidth = window.innerWidth - html.clientWidth;
        const isRTL = getComputedStyle(html).direction === "rtl";

        body.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            if (isRTL) {
                body.style.paddingLeft = `${scrollbarWidth}px`;
            }
            else {
                body.style.paddingRight = `${scrollbarWidth}px`;
            }
        }
    };

    const unlockBodyScroll = () => {
        if (lockCount === 0 || --lockCount > 0) {
            return;
        }
        if (typeof document === "undefined") {
            return;
        }

        const body = document.body;
        body.style.overflow = savedBody.overflow;
        body.style.paddingRight = savedBody.paddingRight;
        body.style.paddingLeft = savedBody.paddingLeft;

        if (savedBody.isIOS) {
            body.style.position = savedBody.position;
            body.style.top = savedBody.top;
            body.style.left = savedBody.left;
            body.style.width = savedBody.width;
            window.scrollTo(savedBody.scrollX, savedBody.scrollY);
        }
    };

    export const defaultUi = {
        transition: {
            name: "",
            enterActiveClass: "transition-opacity duration-300",
            enterToClass: "",
            enterFromClass: "opacity-0",
            leaveActiveClass: "transition-opacity duration-300",
            leaveToClass: "opacity-0",
            leaveFromClass: ""
        },
        popover: ""
    };

    export type Props = {
        ui?: DeepPartial<typeof defaultUi>
    };

    export const defaults: Props = {
        ui: defaultUi
    };
</script>

<script setup lang="ts">
    defineOptions({ inheritAttrs: false });

    const {
        middleware,
        strategy = "fixed",
        placement = "bottom-start",
        offset: offsetProp = 5,
        lockScroll = true
    } = defineProps<{
        middleware?: Middleware[]
        strategy?: Strategy
        placement?: Placement
        offset?: number
        lockScroll?: boolean
    }>();

    const open = defineModel<boolean>("open", { default: false });

    const { props } = await useUtilProps<Props>();

    const referenceEl = ref<HTMLElement | null>(null);

    const setReference = (el: Element | ComponentPublicInstance | null) => {
        if (el && "$el" in el) {
            referenceEl.value = el.$el as HTMLElement;
            return;
        }
        referenceEl.value = el as HTMLElement | null;
    };

    const floating = useTemplateRef<HTMLElement>("floating");

    const { floatingStyles } = useFloating(
        referenceEl,
        floating,
        {
            strategy: computed(() => strategy),
            placement: computed(() => placement),
            whileElementsMounted: autoUpdate,
            middleware: computed(() => [
                offsetMiddleware(offsetProp),
                flip(),
                shift(),
                ...(middleware ?? [])
            ])
        }
    );

    const handleClick = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
            !referenceEl.value?.contains(target)
            && !floating.value?.contains(target)
        ) {
            open.value = false;
        }
    };

    let locked = false;

    watch(
        () => open.value && lockScroll,
        (shouldLock) => {
            if (shouldLock && !locked) {
                lockBodyScroll();
                locked = true;
            }
            else if (!shouldLock && locked) {
                unlockBodyScroll();
                locked = false;
            }
        }
    );

    onMounted(() => {
        document.addEventListener("mousedown", handleClick);
    });

    onUnmounted(() => {
        document.removeEventListener("mousedown", handleClick);
        if (locked) {
            unlockBodyScroll();
            locked = false;
        }
    });
</script>
