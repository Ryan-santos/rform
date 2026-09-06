<template>
    <form
        :class="['RForm', props.ui]"
        @submit.prevent="submit"
        @reset.prevent="model = undefined"
    >
        <LazyRDynamic
            v-if="hasSchema"
            :schema="props.schema as Schema"
        >
            <template
                v-for="slotName in namedSlotNames"
                #[slotName]="scope: SlotScope"
            >
                <slot
                    :name="slotName"
                    v-bind="scope || {}"
                />
            </template>
        </LazyRDynamic>
        <slot
            :model
            :submit
            :validate
        />
    </form>
</template>

<script lang="ts">
    /**
     * Raiz do formulário: provê o model, o `form` que toda `validation` recebe e o
     * registro de rules aos campos aninhados. Renderiza um `schema` pelo `RDynamic` e
     * expõe `model`, `submit` e `validate` no slot default.
     *
     * @example <RForm v-model="data" :schema @submit="salvar"><RText name="nome" /></RForm>
     */
    import { computed, useSlots } from "vue";

    import { useField, useProvide } from "#rform/composables";
    import type { Element, SlotScope } from "#rform/types";
    import type { Schema } from "#rform/types/schema";
    import { defineDefaults } from "#rform/utils";

    import { defineFormRoot } from "../composables/formRoot";
    import { defineRulesList } from "../composables/rulesList";

    type Base = Record<string, unknown>;

    export const defaults = defineDefaults({
        ui: "flex grow flex-col gap-4",
        default: {} as Base,
        schema: {} as Schema
    });

    // Sem field type: o Form mora fora de `components/fields`, então não tem membro
    // no `FieldType` contra o qual estreitar o `rule`.
    export type Props<T extends Base = Base> = Element<typeof defaults> & {
        schema?: Schema;
        onSubmit?: (data: T) => unknown | Promise<unknown>;
    };
</script>

<script setup lang="ts" generic="T extends Base">
    const _props = withDefaults(defineProps<Props<T>>(), {
        required: undefined,
        loading: undefined
    });

    const { id, model, props } = await useField(_props);

    useProvide({
        id,
        model
    });

    defineFormRoot(model);

    const rulesList = defineRulesList();

    const slots = useSlots();

    const namedSlotNames = computed(() => Object.keys(slots).filter((name) => name !== "default"));

    const hasSchema = computed(() => {
        const s = props.value.schema;
        return !!s && Object.keys(s).length > 0;
    });

    const validate = async () => {
        await Promise.all(rulesList.value.values().map((f) => f()));
    };

    const submit = async () => {
        await validate();
        await props.value.onSubmit?.(model.value as T);
    };
</script>