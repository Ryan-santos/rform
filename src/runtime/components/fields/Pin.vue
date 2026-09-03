<template>
    <div :class="props.ui?.container">
        <RUtilsLabel v-if="props.label" />

        <div :class="props.ui?.group?.container">
            <template
                v-for="(_, index) in count"
                :key="index"
            >
                <input
                    :ref="el => setBox(index, el)"
                    :type="props.secret ? 'password' : 'text'"
                    :inputmode="charset.inputmode"
                    :value="chars[index] ?? ''"
                    :class="props.ui?.group?.input"
                    @input="onInput(index, $event)"
                    @keydown="onKeydown(index, $event)"
                    @focus="onFocus(index)"
                    @paste="onPaste(index, $event)"
                >

                <span
                    v-if="hasSeparator(index)"
                    aria-hidden="true"
                    :class="props.ui?.group?.separator"
                >
                    <slot name="separator">&ndash;</slot>
                </span>
            </template>
        </div>

        <RUtilsDescription v-if="props.description" />
        <RUtilsError v-if="props.error" />
    </div>
</template>

<script lang="ts">
    import type { Element } from "#rform/types";
    import { defineDefaults } from "#rform/utils";
    import { useInjection } from "#rform/composables";
    import type Utils from "#rform/types/components/utils/props";
    import { computed, onMounted, ref, watch } from "vue";

    export const defaults = defineDefaults({
        ui: {
            container: "flex grow flex-col gap-1",
            group: {
                container: "flex flex-row items-center gap-2",
                input: "size-12 rounded-(--rf-radius-xl) bg-(--rf-color-background-100) text-center outline-none",
                separator: "px-1 text-current/40"
            }
        },
        default: "",
        length: 6,
        type: "numeric"
    });

    export type Props = Element<typeof defaults, "pin">
        & Utils["Label"]
        & Utils["Description"]
        & Utils["Error"]
        & Utils["Loading"]
        & {
            length?: number
            type?: "numeric" | "alphanumeric"
            secret?: boolean
            autofocus?: boolean
            separator?: number
            onComplete?: (value: string) => void
        };
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined,
        secret: undefined,
        autofocus: undefined
    });

    const {
        model,
        props
    } = await useInjection(_props);

    const count = computed(() => props.value.length ?? defaults.length);

    /**
     * A synchronous mirror of the model. Under a controlled `v-model`, `useModel`
     * only emits — `model.value` still reads the old string until the parent
     * re-renders — so two writes in the same tick would drop a character. Reads
     * go through here; the watcher takes the model back as the source of truth.
     */
    const value = ref("");

    watch(model, current => (value.value = String(current ?? "")), { immediate: true });

    const chars = computed(() => value.value.split(""));

    const commit = (next: string) => {
        const capped = next.slice(0, count.value);
        value.value = capped;
        model.value = capped;
    };

    const charset = computed(() => props.value.type === "alphanumeric"
        ? { inputmode: "text", strip: /[^a-zA-Z0-9]/g, upper: true } as const
        : { inputmode: "numeric", strip: /[^0-9]/g, upper: false } as const);

    const clean = (raw: string) => {
        const kept = raw.replace(charset.value.strip, "");
        return charset.value.upper ? kept.toUpperCase() : kept;
    };

    const boxes = ref<Array<HTMLInputElement | null>>([]);

    const setBox = (index: number, el: unknown) => {
        boxes.value[index] = (el as HTMLInputElement | null) ?? null;
    };

    const focus = (index: number) => {
        boxes.value[Math.min(Math.max(index, 0), count.value - 1)]?.focus();
    };

    const write = (index: number, char: string) => {
        const next = chars.value.slice();
        next[Math.min(index, next.length)] = char;
        commit(next.join(""));
    };

    const remove = (index: number) => {
        const next = chars.value.slice();
        next.splice(index, 1);
        commit(next.join(""));
    };

    const onInput = (index: number, event: Event) => {
        const el = event.target as HTMLInputElement;
        const char = clean(el.value.slice(-1));

        el.value = char || (chars.value[index] ?? "");

        if (!char) {
            return;
        }

        write(index, char);
        focus(index + 1);
    };

    const onKeydown = (index: number, event: KeyboardEvent) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            focus(index - 1);
            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            focus(index + 1);
            return;
        }

        if (event.key !== "Backspace") {
            return;
        }

        event.preventDefault();

        if (chars.value[index]) {
            remove(index);
            return;
        }

        if (index > 0) {
            remove(index - 1);
            focus(index - 1);
        }
    };

    const onPaste = (index: number, event: ClipboardEvent) => {
        event.preventDefault();

        const pasted = clean(event.clipboardData?.getData("text") ?? "");

        if (!pasted) {
            return;
        }

        const start = Math.min(index, chars.value.length);

        commit(chars.value.slice(0, start).join("") + pasted);
        focus(start + pasted.length);
    };

    /**
     * The value is always dense: focusing past its end walks back to the first
     * empty box, so no interaction can leave a hole in the middle.
     */
    const onFocus = (index: number) => {
        if (index > chars.value.length) {
            focus(chars.value.length);
        }
    };

    const hasSeparator = (index: number) => {
        const every = props.value.separator;
        return !!every && (index + 1) % every === 0 && index < count.value - 1;
    };

    /**
     * Fires on the transition into a full value, not on every change while it
     * stays full — overwriting a box of a complete code is not a new completion.
     */
    watch(value, (current, previous) => {
        if (current.length < count.value || (previous?.length ?? 0) >= count.value) {
            return;
        }

        _props.onComplete?.(current);
    });

    onMounted(() => {
        if (props.value.autofocus) {
            focus(chars.value.length);
        }
    });
</script>