<template>
    <div :class="props.ui?.container">
        <RUtilsLabel />

        <RUtilsDropdown
            v-model:open="open"
            :middleware="dropdownMiddleware"
            class="z-999 overflow-auto rounded-lg border border-contrast/10 bg-background-100"
        >
            <template #default="{ reference }">
                <div
                    :ref="reference"
                    :class="[
                        props.ui?.group?.wrapper?.container,
                        open ? props.ui?.group?.wrapper?.open : props.ui?.group?.wrapper?.closed
                    ]"
                    @click="open = !open"
                >
                    <div
                        v-if="$slots.leading"
                        :class="props.ui?.group?.wrapper?.leading"
                    >
                        <slot name="leading" />
                    </div>

                    <div :class="props.ui?.group?.field?.container">
                        <RUtilsPlaceholder />
                        <div :class="props.ui?.group?.field?.selected">
                            <slot
                                v-if="hasSelection && selected"
                                :selected="fieldSlot()"
                                :list="false"
                            >
                                <p v-if="Array.isArray(selected)">
                                    {{ selected.map((item) => item.label).join(", ") }}
                                </p>
                                <p v-else>
                                    {{ selected.label }}
                                </p>
                            </slot>
                        </div>
                    </div>

                    <div
                        v-if="$slots.trailing"
                        :class="props.ui?.group?.wrapper?.trailing"
                    >
                        <slot name="trailing" />
                    </div>

                    <Icon
                        name="select"
                        :class="props.ui?.group?.icon"
                    />

                    <RUtilsLoading />
                </div>
            </template>

            <template #content>
                <div class="sticky top-0 z-0 bg-background-300">
                    <Icon
                        name="search"
                        class="absolute top-1/2 left-3 -z-1 -translate-y-1/2 opacity-60"
                    />
                    <input
                        v-model="search"
                        type="search"
                        placeholder="Pesquisar"
                        class="w-full p-3 pl-10 outline-0 placeholder:text-current/30"
                    />
                </div>
                <ul class="divide-y divide-contrast/10">
                    <li
                        v-for="(option, key) in filteredOptions"
                        :key
                        class="flex cursor-pointer flex-row items-center gap-1 p-3 transition-all duration-300 hover:bg-primary/20"
                        :class="{
                            'text-white bg-primary!': isOptionSelected(option)
                        }"
                        @click="select(option)"
                    >
                        <slot
                            :selected="rowSlot(option)"
                            :list="true"
                        >
                            <p>
                                {{ option.label }}
                            </p>
                        </slot>
                    </li>
                </ul>
            </template>
        </RUtilsDropdown>

        <RUtilsDescription />
        <RUtilsError />
    </div>
</template>

<script lang="ts">
    import { size } from "@floating-ui/vue";
    import { computed, ref } from "vue";

    import { useInjection } from "#rform/composables";
    import type { Element } from "#rform/types";
    import type Utils from "#rform/types/components/utils/props";
    import { defineDefaults } from "#rform/utils";

    export type Primitive = string | number | boolean;
    export type OptArray = Array<Primitive>;
    export type OptArrayObj = Record<string | number, unknown>[];
    export type OptObj<T = unknown> = Record<string | number, T>;
    export type Options = OptArray | OptArrayObj | OptObj;

    export type OptionItem<O = unknown> = {
        value: unknown;
        label: unknown;
        original: O;
    };

    export const defaults = defineDefaults({
        ui: {
            container: "flex grow flex-col gap-1",
            group: {
                wrapper: {
                    container: `
                        relative z-10 flex w-full cursor-pointer flex-row items-center
                        rounded-xl bg-background-100 outline-2 transition-all duration-300
                    `,
                    open: "text-primary outline-primary",
                    closed: "outline-transparent",
                    leading: "flex p-3 pr-0",
                    trailing: "flex p-3 pl-0"
                },
                field: {
                    container: "flex grow flex-col",
                    selected: "flex min-h-12 grow flex-row items-center gap-2 p-3"
                },
                icon: "m-3 ml-0"
            }
        },
        default: null,
        keyValue: "id",
        keyLabel: "name"
    });

    export type Props<
        Opts extends Options = OptArrayObj,
        Multiple extends boolean = false
    > = Omit<Element<typeof defaults>, "modelValue" | "onUpdate:modelValue" | "default"> &
        Utils["Description"] &
        Utils["Dropdown"] &
        Utils["Error"] &
        Utils["Loading"] &
        Utils["Placeholder"] & {
            options: Opts;
            keyValue?: string;
            keyLabel?: string;
            modelFull?: boolean;
            multiple?: Multiple & boolean;
            default?: unknown;
            modelValue?: unknown;
            "onUpdate:modelValue"?: ($event: unknown) => void;
        };

    type InternalProps = Omit<
        Element<typeof defaults>,
        "modelValue" | "onUpdate:modelValue" | "default"
    > & {
        options: Options;
        keyValue?: string;
        keyLabel?: string;
        modelFull?: boolean;
        multiple?: boolean;
        default?: unknown;
        modelValue?: unknown;
    };
</script>

<script setup lang="ts" generic="Opts extends Options, Multiple extends boolean = false">
    const _props = defineProps<Props<Opts, Multiple>>();

    type Original =
        Opts extends Array<infer U>
            ? U
            : Opts extends Record<string | number, infer V>
              ? Record<string | number, V>
              : unknown;

    type Item = OptionItem<Original>;
    type Selected = Multiple extends true ? Item[] : Item;

    defineSlots<{
        default(props: { selected: Selected; list: boolean }): void;
        leading(): void;
        trailing(): void;
    }>();

    const { model, props } = await useInjection(_props as unknown as InternalProps);

    const isRecord = (value: unknown): value is Record<string, unknown> => {
        return typeof value === "object" && value !== null;
    };

    const getProperty = (obj: unknown, path: string | undefined): unknown => {
        if (!path || !isRecord(obj)) {
            return undefined;
        }

        return path.split(".").reduce<unknown>((acc, part) => {
            return isRecord(acc) ? acc[part] : undefined;
        }, obj);
    };

    const _options = computed<Item[]>(() => {
        const { options, keyValue, keyLabel } = props.value;

        if (!options) {
            return [];
        }

        if (Array.isArray(options)) {
            if (options.length === 0) {
                return [];
            }

            if (options.every((item) => typeof item !== "object" || item === null)) {
                return (options as Primitive[]).map((item) => ({
                    value: item,
                    label: item,
                    original: item as Original
                }));
            }

            return (options as Record<string, unknown>[]).map((item) => ({
                value: getProperty(item, keyValue),
                label: getProperty(item, keyLabel),
                original: item as Original
            }));
        }

        if (typeof options === "object") {
            return Object.entries(options).map(([key, value]) => {
                if (isRecord(value)) {
                    return {
                        value: key,
                        label: getProperty(value, keyLabel),
                        original: { [key]: value } as Original
                    };
                }

                return {
                    value: key,
                    label: value,
                    original: { [key]: value } as Original
                };
            });
        }

        return [];
    });

    const search = ref("");

    const filteredOptions = computed<Item[]>(() => {
        const term = search.value.trim().toLowerCase();

        if (!term) {
            return _options.value;
        }

        return _options.value.filter(({ label }) => {
            return String(label ?? "").toLowerCase().includes(term);
        });
    });

    const select = (option: Item) => {
        const stored = props.value.modelFull ? option.original : option.value;

        if (!props.value.multiple) {
            model.value = stored;
            return;
        }

        const current = model.value as unknown;
        const list: unknown[] = Array.isArray(current) ? [...current] : [];
        const key = props.value.keyValue;

        const idx =
            props.value.modelFull && key
                ? list.findIndex((item) => isRecord(item) && item[key] === option.value)
                : list.indexOf(stored);

        if (idx >= 0) {
            list.splice(idx, 1);
        } else {
            list.push(stored);
        }

        model.value = list;
    };

    const matchesModel = (value: unknown): boolean => {
        const key = props.value.keyValue;
        const current = model.value as unknown;

        if (props.value.multiple && Array.isArray(current)) {
            const arr = current as unknown[];

            if (props.value.modelFull && key) {
                return arr.some((item) => isRecord(item) && item[key] === value);
            }

            return arr.includes(value);
        }

        if (props.value.modelFull && key && isRecord(current)) {
            return value === current[key];
        }

        return value === current;
    };

    const selected = computed<Item | Item[] | undefined>(() => {
        const filtered = _options.value.filter(({ value }) => matchesModel(value));

        if (props.value.multiple) {
            return filtered;
        }

        return filtered.at(0);
    });

    const hasSelection = computed(() => {
        if (Array.isArray(selected.value)) {
            return selected.value.length > 0;
        }

        return selected.value !== undefined;
    });

    const isOptionSelected = (option: Item): boolean => {
        const current = selected.value;

        if (Array.isArray(current)) {
            return current.some((item) => item.value === option.value);
        }

        return current?.value === option.value;
    };

    const fieldSlot = (): Selected => selected.value as Selected;

    const rowSlot = (option: Item): Selected => {
        return (props.value.multiple ? [option] : option) as Selected;
    };

    const open = ref(false);

    const dropdownMiddleware = [
        size({
            apply({ availableHeight, elements, rects }) {
                Object.assign(elements.floating.style, {
                    width: `${Math.max(0, rects.reference.width)}px`,
                    maxHeight: `${Math.max(0, availableHeight) - 10}px`
                });
            }
        })
    ];
</script>
