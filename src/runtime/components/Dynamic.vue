<template>
    <template v-if="isSchema">
        <template
            v-for="(field, key) in entries"
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
        v-else-if="config?.type === 'object'"
        :is="resolved"
        :name="name"
        v-bind="rest"
    >
        <RDynamic :schema="objectChildren">
            <template
                v-for="(_, slotName) in $slots"
                #[slotName]="scope"
            >
                <slot
                    :name="slotName"
                    v-bind="scope || {}"
                />
            </template>
        </RDynamic>
    </component>

    <component
        v-else-if="config?.type === 'array'"
        :is="resolved"
        :name="name"
        v-bind="rest"
    >
        <template v-slot="{ index }">
            <RDynamic
                v-if="arrayChild"
                :name="index"
                :schema="arrayChild"
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
    /**
     * Renderiza um `schema` de `useRForm`: recursivo em `object` e `array`, e cada
     * entrada com `slot` vira um slot nomeado que sobe até o `RForm`.
     *
     * @example <RDynamic :schema />
     */
    import { computed } from "vue";

    import map from "#rform/components-map";
    import type { SlotScope } from "#rform/types";
    import type { FieldConfig, Schema } from "#rform/types/schema";

    export type Props = {
        name?: string | number;
        schema: Schema | FieldConfig;
    };

    const props = defineProps<Props>();

    // Declarado, não inferido: RDynamic renderiza RDynamic, e inferir o escopo do
    // slot pelo uso o faria depender de si mesmo (TS7022).
    defineSlots<Record<string, (scope: SlotScope) => unknown>>();

    const isSchema = computed(
        () =>
            !!props.schema &&
            typeof props.schema === "object" &&
            !("type" in props.schema) &&
            !("slot" in props.schema)
    );

    /** As entradas de um schema aninhado; vazio quando o `schema` é um campo. */
    const entries = computed((): Schema => (isSchema.value ? (props.schema as Schema) : {}));

    /** O campo, quando não é schema. Todo narrowing mora aqui e não no template. */
    const config = computed(() => (isSchema.value ? undefined : (props.schema as FieldConfig)));

    const objectChildren = computed(() =>
        config.value?.type === "object" ? config.value.children : {}
    );

    /** O item de um `array`; `undefined` quando é slot, e aí quem renderiza é o pai. */
    const arrayChild = computed(() => {
        const current = config.value;

        if (current?.type !== "array" || "slot" in current.children) {
            return undefined;
        }

        return current.children;
    });

    const resolved = computed(() => (config.value ? map[config.value.type] : null));

    const rest = computed(() => {
        if (!config.value) {
            return {};
        }

        const { type, children, slot, ...r } = props.schema as Record<string, unknown>;

        return r;
    });
</script>