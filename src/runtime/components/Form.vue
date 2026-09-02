<template>
    <form
        :class="['RForm', props.ui]"
        @submit.prevent="submit"
        @reset.prevent="model = undefined"
    >
        <RDynamic
            v-if="hasSchema"
            :schema="(props.schema as Schema)"
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
        </RDynamic>
        <slot
            :model
            :submit
            :validate
        />
    </form>
</template>

<script lang="ts">
    import type { Element, SlotScope } from "#rform/types";
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

    // No field type: Form lives outside `components/fields`, so it has no
    // member in `FieldType` to narrow `rule` against.
    export type Props<T extends Base = Base> = Element<typeof defaults> & {
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

<style>
    /**
     * Não é `scoped`: os `input` moram nos componentes filhos, e um seletor com
     * `data-v-*` não os alcança sem `:deep()`. Quem delimita é a classe-gancho
     * `RForm`, emitida acima fora de `props.ui` para o usuário não removê-la ao
     * sobrescrever `ui`.
     *
     * Na `@layer rform` junto com os tokens, então o app continua podendo
     * sobrescrever.
     *
     * Sem nesting de propósito. O `<style>` de SFC passa pelo postcss do app, e o
     * default do Nuxt tem só `autoprefixer` e `cssnano` — não `postcss-nested`
     * (que é o que achata o `src/runtime/style.css`, via mkdist). Aninhado, o
     * seletor chegaria cru ao browser.
     */
    @layer rform {
        .RForm input[type="number"],
        .RForm input::-webkit-outer-spin-button,
        .RForm input::-webkit-inner-spin-button {
            appearance: none;
        }

        .RForm input:-webkit-autofill,
        .RForm input:-webkit-autofill:focus {
            transition:
                background-color 600000s 0s,
                color 600000s 0s;
        }

        .RForm input[data-autocompleted] {
            background-color: transparent !important;
        }
    }
</style>