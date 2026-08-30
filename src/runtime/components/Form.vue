<template>
    <form
        :class="props.ui"
        @submit.prevent="submit"
        @reset.prevent="model = undefined"
    >
        <RDynamic
            v-if="hasSchema"
            :schema="(props.schema as Schema)"
        >
            <template
                v-for="slotName in namedSlotNames"
                #[slotName]="scope: Record<string, unknown>"
            >
                <slot
                    :name="slotName"
                    v-bind="scope || {}"
                />
            </template>
        </RDynamic>
        <slot
            :model
            :submit
            :validate
        />
    </form>
</template>

<script lang="ts">
    import type { Element } from "#rform/types";
    import type { Schema } from "#rform/types/schema";
    import { useInjection, useProvide } from "#rform/composables";
    import { defineFormRoot } from "../composables/formRoot";
    import { defineRulesList } from "../composables/rulesList";
    import { defineDefaults } from "#rform/utils";
    import { computed, useSlots } from "vue";

    type Base = Record<string, unknown>;

    export const defaults = defineDefaults({
        ui: "flex grow flex-col gap-4",
        default: {} as Base,
        schema: {} as Schema
    });

    export type Props<T extends Base = Base> = Element<typeof defaults, "form"> & {
        schema?: Schema;
        onSubmit?: (data: T) => unknown | Promise<unknown>
    };
</script>

<script setup lang="ts" generic="T extends Base">
    const _props = withDefaults(defineProps<Props<T>>(), {
        required: undefined,
        loading: undefined
    });

    const {
        id,
        model,
        props
    } = await useInjection(_props);

    useProvide({
        id,
        model
    });

    defineFormRoot(model);

    const rulesList = defineRulesList();

    const slots = useSlots();

    const namedSlotNames = computed(() =>
        Object.keys(slots).filter(name => name !== "default"));

    const hasSchema = computed(() => {
        const s = props.value.schema;
        return !!s && Object.keys(s).length > 0;
    });

    const validate = async () => {
        await Promise.all(rulesList.value.values().map(f => f()));
    };

    const submit = async () => {
        await validate();
        await props.value.onSubmit?.(model.value as T);
    };
</script>