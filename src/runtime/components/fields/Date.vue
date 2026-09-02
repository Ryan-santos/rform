<template>
    <div :class="props.ui?.container">
        <RUtilsLabel />

        <RUtilsDropdown
            v-model:open="open"
            :class="props.ui?.popover"
        >
            <template #default="{ reference }">
                <div
                    :ref="reference"
                    :class="[
                        props.ui?.group?.wrapper?.container,
                        open ? props.ui?.group?.wrapper?.open : props.ui?.group?.wrapper?.closed
                    ]"
                >
                    <div
                        v-if="$slots.leading"
                        :class="props.ui?.group?.wrapper?.leading"
                    >
                        <slot name="leading" />
                    </div>

                    <div
                        ref="field"
                        :class="props.ui?.group?.field?.container"
                        @focusin="onFocusIn"
                        @focusout="onFocusOut"
                    >
                        <RUtilsPlaceholder :focused="focused" />
                        <div
                            :class="[
                                props.ui?.group?.field?.inputs,
                                inputsHidden ? props.ui?.group?.field?.inputsHidden : ''
                            ]"
                        >
                            <input
                                v-if="props.mode === 'multiple'"
                                v-model="typed[0]"
                                :name="String(props.name)"
                                type="text"
                                :placeholder="placeholderHint"
                                readonly
                                :class="props.ui?.group?.field?.input"
                            />
                            <input
                                v-else
                                v-model="typed[0]"
                                v-mask="mask"
                                :name="String(props.name)"
                                type="text"
                                :placeholder="placeholderHint"
                                :class="props.ui?.group?.field?.input"
                                @blur="validate(0)"
                            />
                            <template v-if="props.mode === 'range'">
                                <span :class="props.ui?.group?.field?.separator"> até </span>
                                <input
                                    v-model="typed[1]"
                                    v-mask="mask"
                                    :name="String(props.name)"
                                    type="text"
                                    :placeholder="placeholderHint"
                                    :class="[
                                        props.ui?.group?.field?.input,
                                        props.ui?.group?.field?.inputEnd
                                    ]"
                                    @blur="validate(1)"
                                />
                            </template>
                        </div>
                    </div>

                    <button
                        type="button"
                        :class="props.ui?.group?.trigger"
                        @click="open = !open"
                    >
                        <Icon name="calendar" />
                    </button>

                    <div
                        v-if="$slots.trailing"
                        :class="props.ui?.group?.wrapper?.trailing"
                    >
                        <slot name="trailing" />
                    </div>

                    <RUtilsLoading />
                </div>
            </template>

            <template #content>
                <RUtilsCalendar />
            </template>
        </RUtilsDropdown>

        <RUtilsDescription />
        <RUtilsError />
    </div>
</template>

<script lang="ts">
    import { vMask } from "#rform/utils";
    import { computed, ref, useTemplateRef, watch } from "vue";

    import { useInjection } from "#rform/composables";
    import type { Element } from "#rform/types";
    import type Utils from "#rform/types/components/utils/props";
    import { defineDefaults } from "#rform/utils";

    import { pad } from "./Hour.vue";
    import {
        formatIso,
        parseIncoming,
        type DateValue,
        type DisableSpec,
        type Mode,
        type ModelType
    } from "../utils/Calendar.vue";

    export type { DateValue, DisableSpec, Mode, ModelType };

    export const defaults = defineDefaults({
        ui: {
            container: "flex grow flex-col gap-1",
            group: {
                wrapper: {
                    container: `
                        relative z-0 flex w-full flex-row items-center rounded-(--rf-radius-xl)
                        bg-(--rf-color-background-100) outline-2 transition-all duration-300
                        has-[:focus]:outline-(--rf-color-primary) has-[:focus]:text-(--rf-color-primary)
                    `,
                    open: "text-(--rf-color-primary) outline-(--rf-color-primary)",
                    closed: "outline-transparent",
                    leading: "flex p-3 pr-0",
                    trailing: "flex p-3 pl-0"
                },
                field: {
                    container: "relative grow",
                    inputs: "flex flex-row items-center transition-opacity duration-300",
                    inputsHidden: "opacity-0",
                    input: "w-full rounded-(--rf-radius-lg) bg-transparent p-3 outline-none",
                    inputEnd: "text-end",
                    separator: "my-auto w-fit px-1 opacity-50"
                },
                trigger: `
                    flex cursor-pointer p-3 transition-colors
                    hover:text-(--rf-color-primary)
                `
            },
            popover: "z-999 w-72"
        },
        default: ""
    });

    export type Props<M extends Mode = "single"> = Omit<
        Element<typeof defaults, "date">,
        "modelValue" | "onUpdate:modelValue" | "default"
    > &
        Utils["Description"] &
        Utils["Dropdown"] &
        Utils["Error"] &
        Utils["Loading"] &
        Utils["Length"] &
        Utils["Placeholder"] & {
            mode?: M;
            time?: boolean;
            disable?: DisableSpec;
            default?: ModelType<M>;
            modelValue?: ModelType<M>;
            "onUpdate:modelValue"?: ($event: ModelType<M>) => void;
        };

    type InternalProps = Omit<
        Element<typeof defaults, "date">,
        "modelValue" | "onUpdate:modelValue" | "default"
    > &
        Utils["Description"] &
        Utils["Dropdown"] &
        Utils["Error"] &
        Utils["Loading"] &
        Utils["Length"] &
        Utils["Placeholder"] & {
            mode?: Mode;
            time?: boolean;
            disable?: DisableSpec;
            default?: unknown;
            modelValue?: unknown;
        };
</script>

<script setup lang="ts" generic="M extends Mode = 'single'">
    const _props = withDefaults(defineProps<Props<M>>(), {
        required: undefined,
        loading: undefined
    });

    const { model, props } = await useInjection(_props as unknown as InternalProps);

    const formatLocaleDate = (d: Date) =>
        `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    const formatLocaleDateTime = (d: Date) =>
        `${formatLocaleDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const formatLocal = (d: Date | null): string => {
        if (!d) {
            return "";
        }
        return props.value.time ? formatLocaleDateTime(d) : formatLocaleDate(d);
    };

    const toIso = (d: Date | null) => formatIso(d, !!props.value.time);

    const parseLocal = (s: string): Date | null => {
        const trimmed = s?.trim() ?? "";

        if (!trimmed) {
            return null;
        }

        const pattern = props.value.time
            ? /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
            : /^(\d{2})\/(\d{2})\/(\d{4})$/;

        const m = trimmed.match(pattern);

        if (!m) {
            return null;
        }

        const [, dd, mm, yy, hh, mi] = m as unknown as [
            string,
            string,
            string,
            string,
            string?,
            string?
        ];
        const d = new Date(+yy, +mm - 1, +dd, hh ? +hh : 0, mi ? +mi : 0);

        if (Number.isNaN(d.getTime())) {
            return null;
        }

        if (d.getDate() !== +dd || d.getMonth() !== +mm - 1 || d.getFullYear() !== +yy) {
            return null;
        }

        return d;
    };

    const typed = ref<[string, string]>(["", ""]);

    const parsedTyped = computed<[Date | null, Date | null]>(() => [
        parseLocal(typed.value[0]),
        parseLocal(typed.value[1])
    ]);

    const mask = computed(() => ({
        mask: props.value.time ? "##/##/#### ##:##" : "##/##/####",
        eager: true
    }));

    const placeholderHint = computed(() => (props.value.time ? "dd/mm/aaaa hh:mm" : "dd/mm/aaaa"));

    const incomingToTyped = (val: unknown): [string, string] => {
        const m = props.value.mode ?? "single";

        if (m === "range") {
            const arr = Array.isArray(val) ? val : [];
            return [formatLocal(parseIncoming(arr[0])), formatLocal(parseIncoming(arr[1]))];
        }

        if (m === "multiple") {
            const arr: unknown[] = Array.isArray(val) ? val : [];
            const list = arr.map((v) => formatLocal(parseIncoming(v))).filter(Boolean);
            return [list.join(", "), ""];
        }

        return [formatLocal(parseIncoming(val)), ""];
    };

    const computeModel = (): DateValue => {
        const m = props.value.mode ?? "single";

        if (m === "range") {
            const [a, b] = parsedTyped.value;
            return [toIso(a), toIso(b)];
        }

        return toIso(parsedTyped.value[0]) ?? "";
    };

    let internalWrite = false;

    watch(
        model,
        (val) => {
            if (internalWrite) {
                return;
            }
            const next = incomingToTyped(val);
            if (next[0] !== typed.value[0] || next[1] !== typed.value[1]) {
                typed.value = next;
            }
        },
        {
            immediate: true,
            flush: "sync"
        }
    );

    watch(
        typed,
        () => {
            if (props.value.mode === "multiple") {
                return;
            }

            internalWrite = true;
            const next = computeModel();
            if (JSON.stringify(next) !== JSON.stringify(model.value)) {
                model.value = next;
            }
            internalWrite = false;
        },
        {
            deep: true,
            flush: "sync"
        }
    );

    const validate = (index: number) => {
        if (props.value.mode === "multiple") {
            return;
        }

        if (!typed.value[index]) {
            return;
        }

        const d = parsedTyped.value[index];
        if (!d) {
            const next: [string, string] = [...typed.value] as [string, string];
            next[index] = "";
            typed.value = next;
        }
    };

    const field = useTemplateRef<HTMLElement>("field");
    const open = ref(false);
    const focused = ref(false);

    const hasValue = computed(() => !!typed.value[0] || !!typed.value[1]);

    const inputsHidden = computed(
        () => !!props.value.placeholder && !focused.value && !hasValue.value
    );

    const onFocusIn = () => {
        focused.value = true;
        open.value = true;
    };

    const onFocusOut = (event: FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (!next || !field.value?.contains(next)) {
            focused.value = false;
        }
    };
</script>