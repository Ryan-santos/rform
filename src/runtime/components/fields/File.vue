<template>
    <div :class="props.ui?.container">
        <RUtilsLabel />

        <label
            :class="[
                props.ui?.group?.dropzone,
                {
                    [props.ui?.group?.hasFile ?? '']: hasValue,
                    [props.ui?.group?.dragging ?? '']: dragEvent
                }
            ]"
            @drop.prevent="onChangeFile"
            @dragenter.prevent
            @dragover.prevent
        >
            <input
                type="file"
                :accept="props.accept"
                :multiple="props.multiple"
                :class="props.ui?.group?.input"
                @change="onChangeFile"
            >

            <div :class="props.ui?.group?.close">
                <button
                    v-if="hasValue"
                    :class="props.ui?.group?.closeButton"
                    @click.prevent="model = props.multiple ? [] : null"
                >
                    <Icon name="close" />
                </button>
            </div>

            <slot>
                <!-- Multiple mode: list of files -->
                <div
                    v-if="props.multiple && files.length > 0"
                    class="flex w-full flex-col gap-2"
                >
                    <div
                        v-for="(f, i) in files"
                        :key="i"
                        :class="props.ui?.group?.preview?.container"
                    >
                        <Icon
                            name="tabler:file-check"
                            size="1.5rem"
                            class="text-success"
                        />
                        <span class="flex-1 truncate text-sm">{{ f.name }}</span>
                        <span :class="props.ui?.group?.preview?.size">{{ formatBytes(f.size) }}</span>
                        <button
                            class="pointer-events-auto rounded-full bg-danger px-1 py-px text-xs text-white"
                            @click.prevent="removeFile(i)"
                        >
                            <Icon name="close" />
                        </button>
                    </div>
                </div>

                <!-- Single mode: existing preview -->
                <div
                    v-else-if="!props.multiple && (!!file && !loading || url)"
                    :class="props.ui?.group?.preview?.container"
                >
                    <img
                        v-if="!!image"
                        :src="image"
                        :class="props.ui?.group?.preview?.image"
                    >
                    <Icon
                        v-else
                        name="tabler:file-check"
                        size="4rem"
                        class="text-success"
                    />
                    <span>
                        {{ file?.name || url?.split("/").at(-1) }} <br>
                        <span
                            v-if="file?.size"
                            :class="props.ui?.group?.preview?.size"
                        >
                            {{ formatBytes(file?.size) }}
                        </span>
                    </span>
                </div>

                <Icon
                    name="material-symbols-light:file-open-outline"
                    size="4rem"
                />
                <div :class="props.ui?.group?.info?.container">
                    <p :class="props.ui?.group?.info?.text">
                        {{ props.placeholder }}
                    </p>
                    <ul :class="props.ui?.group?.info?.list">
                        <li
                            v-for="(value, index) in acceptSplit"
                            :key="index"
                            :class="props.ui?.group?.info?.badge"
                        >
                            .{{ value }}
                        </li>
                    </ul>
                </div>
            </slot>

            <Transition>
                <div
                    v-show="loading"
                    :class="props.ui?.group?.loading?.container"
                >
                    <Icon
                        name="line-md:uploading-loop"
                        size="5rem"
                    />
                    Carregando...
                </div>
            </Transition>
        </label>

        <RUtilsDescription />
        <RUtilsError />
    </div>
</template>

<script lang="ts">
    import type { Element } from "#rform/types";
    import { defineDefaults } from "#rform/utils";
    import { useInjection } from "#rform/composables";
    import type Utils from "#rform/types/components/utils/props";
    import { computed, onMounted, onUnmounted, ref, watch } from "vue";

    export const defaults = defineDefaults({
        ui: {
            container: "flex grow flex-col gap-1",
            group: {
                dropzone: `
                    relative flex h-full cursor-pointer flex-row items-center justify-center
                    gap-3 rounded-xl border-2 border-dashed border-contrast/10 bg-background-100 p-2
                    text-center transition-all duration-500
                    hover:border-primary hover:text-primary
                `,
                hasFile: "border-success",
                dragging: "animate-bounce",
                input: "pointer-events-none absolute top-0 size-0 opacity-0",
                close: "pointer-events-none absolute top-0 right-0",
                closeButton: "pointer-events-auto -translate-y-1/2 rounded-full bg-danger px-1 py-px text-white",
                preview: {
                    container: "flex flex-row items-center gap-3 text-start",
                    image: "size-16 rounded-xl bg-background object-contain object-center",
                    size: "text-sm text-contrast/50"
                },
                info: {
                    container: "flex flex-col gap-1",
                    text: "text-sm text-contrast/50",
                    list: "flex flex-row flex-wrap gap-1",
                    badge: `
                        m-1 inline-flex rounded-md bg-current/10 px-2 py-1 text-xs
                        leading-none font-bold
                    `
                },
                loading: {
                    container: `
                        absolute inset-0 flex size-full flex-col items-center justify-center
                        rounded-2xl bg-success/50 p-6 backdrop-blur-sm
                    `
                }
            }
        },
        placeholder: "Araste ou click aqui para adicionar:",
        default: null
    });

    export type Props<
        Multiple extends boolean = false
    > = Element<typeof defaults, "file", (Multiple extends true ? Array<File> : File) | null>
        & Utils["Label"]
        & Utils["Description"]
        & Utils["Error"]
        & {
            placeholder?: string
            accept: string
            multiple?: Multiple
        };

    /**
     * Generic-free mirror of `Props` for `useInjection`, as in Select.vue: the
     * conditional model type cascades into a union the checker cannot represent.
     */
    type InternalProps = Omit<
        Element<typeof defaults, "file">,
        "modelValue" | "onUpdate:modelValue" | "default"
    > & {
        placeholder?: string;
        accept: string;
        multiple?: boolean;
        default?: unknown;
        modelValue?: unknown;
    };
</script>

<script setup lang="ts" generic="Multiple extends boolean = false">
    const _props = defineProps<Props<Multiple>>();

    const {
        model,
        props
    } = await useInjection(_props as unknown as InternalProps);

    const loading = ref(false);
    const acceptSplit = props.value.accept?.replaceAll(/[.\s]/g, "").split(",") ?? [];

    const getType = (name: string | undefined) => {
        return name?.split(".").at(-1) ?? "";
    };

    const files = computed<File[]>(() => {
        if (props.value.multiple && Array.isArray(model.value)) {
            return model.value.filter((f): f is File => typeof f === "object" && f !== null && "name" in f);
        }

        return [];
    });

    const file = computed<File | null>(() => {
        if (!props.value.multiple && model.value instanceof File) {
            return model.value;
        }

        return null;
    });

    const hasValue = computed(() => props.value.multiple ? files.value.length > 0 : !!file.value || !!url.value);

    function useIsURL (string: string) {
        return (/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*$/).test(string);
    }

    const url = computed(() => {
        if (!file.value && useIsURL(model.value as unknown as string)) {
            return model.value as unknown as string;
        }
        else {
            return undefined;
        }
    });

    const image = ref("");

    watch(model, async () => {
        const imgTypes = [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "bmp",
            "tiff",
            "webp",
            "svg"
        ];

        if (file.value && imgTypes.includes(getType(file.value?.name))) {
            loading.value = true;

            const reader = new FileReader();
            reader.readAsDataURL(file.value);

            const result = await new Promise<string>((resolve, reject) => {
                reader.onload = e => resolve(e.target?.result?.toString() ?? "");
                reader.onerror = error => reject(error);
            });

            loading.value = false;
            image.value = result;
        }
        else if (imgTypes.includes(getType(url.value))) {
            image.value = url.value ?? "";
        }
    }, {
        immediate: true
    });

    const onChangeFile = (event: Event) => {
        loading.value = true;
        const fileList = (event?.target as HTMLInputElement)?.files ?? (event as DragEvent)?.dataTransfer?.files;

        if (props.value.multiple) {
            if (fileList && fileList.length > 0) {
                const valid = Array.from(fileList).filter(f =>
                    acceptSplit.includes("*") || acceptSplit.includes(getType(f?.name))
                );

                model.value = [
                    ...(Array.isArray(model.value) ? model.value : []),
                    ...valid
                ];
            }
        }
        else {
            const _file = fileList?.[0];

            if (_file && (acceptSplit.includes("*") || acceptSplit.includes(getType(_file?.name)))) {
                model.value = _file;
            }
        }

        loading.value = false;
    };

    const removeFile = (index: number) => {
        if (Array.isArray(model.value)) {
            model.value = model.value.filter((_, i) => i !== index);
        }
    };

    const formatBytes = (bytes: number): string => {
        const sizes = [
            "Bytes",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        if (bytes === 0) {
            return "0 Byte";
        }

        const i = Number.parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));

        return Math.round((bytes / Math.pow(1024, i))) + " " + sizes[i];
    };

    const dragEvent = ref(false);

    const eventListener = (types: string[], func: () => void) => {
        types.forEach((type) => {
            onMounted(() => {
                addEventListener(type, func);
            });

            onUnmounted(() => {
                removeEventListener(type, func);
            });
        });
    };

    eventListener(["dragenter"], () => {
        dragEvent.value = true;
    });

    eventListener([
        "dragend",
        "drop"
    ], () => {
        dragEvent.value = false;
    });
</script>