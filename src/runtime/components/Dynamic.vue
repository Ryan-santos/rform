<template>
    <template v-if="isSchema">
        <template
            v-for="(field, key) in (schema as Schema)"
            :key="key"
        >
            <slot
                v-if="'slot' in field"
                :name="field.slot"
                :field-name="key"
                :rule="field.rule"
            />
            <RDynamic
                v-else
                :name="key"
                :schema="field"
            />
        </template>
    </template>

    <component
        v-else-if="(schema as FieldConfig).type === 'object'"
        :is="resolved"
        :name="name"
        v-bind="rest"
    >
        <RDynamic :schema="(schema as { children: Schema }).children">
            <template
                v-for="(_, slotName) in $slots"
                #[slotName]="scope: Record<string, unknown>"
            >
                <slot
                    :name="slotName"
                    v-bind="scope || {}"
                />
            </template>
        </RDynamic>
    </component>

    <component
        v-else-if="(schema as FieldConfig).type === 'array'"
        :is="resolved"
        :name="name"
        v-bind="rest"
    >
        <template v-slot="{ index }">
            <RDynamic
                v-if="!('slot' in (schema as { children: FieldConfig | SlotField }).children)"
                :name="index"
                :schema="(schema as { children: FieldConfig }).children"
            />
        </template>
    </component>

    <component
        v-else
        :is="resolved"
        :name="name"
        v-bind="rest"
    />
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import map from "#rform/components-map";
    import type { FieldConfig, Schema, SlotField } from "#rform/types/schema";

    export type Props = {
        name?: string | number;
        schema: Schema | FieldConfig;
    };

    const props = defineProps<Props>();

    const isSchema = computed(() =>
        !!props.schema
        && typeof props.schema === "object"
        && !("type" in props.schema)
        && !("slot" in props.schema));

    const resolved = computed(() => {
        if (isSchema.value) {
            return null;
        }
        return map[(props.schema as FieldConfig).type];
    });

    const rest = computed(() => {
        if (isSchema.value) {
            return {};
        }
        const { type, children, slot, ...r } = props.schema as Record<string, unknown>;
        return r;
    });
</script>
