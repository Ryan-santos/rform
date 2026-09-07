<template>
    <form
        ref="form"
        :class="['RForm', props.ui]"
        @submit.prevent="submit"
        @reset.prevent="model = undefined"
    >
        <LazyRDynamic
            v-if="schema"
            :schema
        >
            <template
                v-for="slotName in namedSlotNames"
                #[slotName]="scope"
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
            :setErrors
        />
    </form>
</template>

<script lang="ts">
    /**
     * Raiz do formulário: provê o model, o `form` que toda `validation` recebe, o
     * registro de rules e o mapa de erros aos campos aninhados. Renderiza um `schema`
     * pelo `RDynamic` e expõe `model`, `submit`, `validate`, `setErrors` e `errors`.
     *
     * @example <RForm v-model="data" :rules @submit="salvar"><RText name="nome" /></RForm>
     */
    import { computed, nextTick, useSlots, useTemplateRef } from "vue";
    // Type-only: o zod não entra no bundle por esta linha.
    import type { ZodType } from "zod";

    import { useField, useProvide } from "#rform/composables";
    import type { Element, FormErrors } from "#rform/types";
    import type { Schema } from "#rform/types/schema";
    import { defineDefaults, flattenErrors, focusFirstError, isErrorsObject } from "#rform/utils";

    import { defineErrorsBag } from "../composables/errorsBag";
    import { defineFormRoot } from "../composables/formRoot";
    import { definePendingList } from "../composables/pendingList";
    import { defineRulesList } from "../composables/rulesList";

    type Base = Record<string, unknown>;

    export const defaults = defineDefaults({
        ui: "flex grow flex-col gap-4",
        default: {} as Base,
        schema: {} as Schema
    });

    // Sem field type: o Form mora fora de `components/fields`, então não tem membro
    // no `FieldType` contra o qual estreitar o `rule`.
    //
    // `rules`, `focusError` e o retorno do `onSubmit` ficam **fora** do `defaults`: o
    // `merger` copia a chave de qualquer jeito, e um `focusError: true` ali seria
    // impossível de desligar (ver "O `errorsBag`" no `.claude/CLAUDE.md`).
    export type Props<T extends Base = Base> = Element<typeof defaults> & {
        schema?: Schema;
        rules?: ZodType;
        focusError?: boolean;
        onSubmit?: (data: T) => FormErrors | void | Promise<FormErrors | void>;
    };
</script>

<script setup lang="ts" generic="T extends Base">
    // `focusError` no `withDefaults` como `undefined`: `focusError?: boolean` compila
    // com `type: Boolean`, e o boolean casting do Vue transformaria a prop ausente em
    // `false`, desligando o recurso por padrão.
    const _props = withDefaults(defineProps<Props<T>>(), {
        required: undefined,
        loading: undefined,
        focusError: undefined
    });

    const { id, model, props } = await useField(_props);

    useProvide({
        id,
        model
    });

    defineFormRoot(model);

    const rulesList = defineRulesList();

    const pendingList = definePendingList();

    const errors = defineErrorsBag();

    const formEl = useTemplateRef<HTMLFormElement>("form");

    const slots = useSlots();

    const namedSlotNames = computed(() => Object.keys(slots).filter((name) => name !== "default"));

    // O narrowing mora aqui, não no template: `{}` é o default, e o `LazyRDynamic`
    // pede um `Schema` de verdade.
    const schema = computed(() => {
        const current = props.value.schema;

        return current && Object.keys(current).length > 0 ? current : undefined;
    });

    // O `nextTick` é obrigatório: o watcher do campo é `flush: "sync"`, mas o
    // `<p class="RUtilsError">` só existe depois do render.
    const focusFirst = async () => {
        if (props.value.focusError === false || !Object.keys(errors.value).length) {
            return;
        }

        await nextTick();

        focusFirstError(formEl.value);
    };

    const setErrors = async (input?: FormErrors) => {
        errors.value = input ? flattenErrors(input) : {};

        await focusFirst();
    };

    const validate = async () => {
        // Antes de tudo: o `safeParseAsync` do `:rules` precisa rodar sobre o model já
        // assentado, e um upload em voo ainda não escreveu nele.
        const pending = await Promise.all(
            [...pendingList.value.entries()].map(async ([key, fn]) => [key, await fn()] as const)
        );

        const entries = [...rulesList.value.entries()];

        const results = await Promise.all(
            entries.map(async ([key, fn]) => [key, await fn()] as const)
        );

        const messages: Record<string, string> = {};

        const rules = props.value.rules;

        if (rules) {
            // `safeParseAsync`: rule por nome de preset vira `z.any().superRefine(async …)`
            // no objeto agregado, e um parse síncrono lançaria.
            const parsed = await rules.safeParseAsync(model.value);

            if (!parsed.success) {
                for (const issue of parsed.error.issues) {
                    const path = issue.path.join(".");

                    messages[path] ??= issue.message;
                }
            }
        }

        // A rule do campo vence o issue agregado: é a declaração mais local.
        for (const [key, message] of results) {
            if (message) {
                messages[key] = message;
            }
        }

        // A menor precedência de todas: "o upload falhou" só aparece se nada mais
        // tiver o que dizer sobre aquele campo.
        for (const [key, message] of pending) {
            if (message) {
                messages[key] ??= message;
            }
        }

        errors.value = messages;

        await focusFirst();

        return Object.keys(messages).length === 0;
    };

    const submit = async () => {
        if (!(await validate())) {
            return { ...errors.value };
        }

        const returned = await props.value.onSubmit?.(model.value as T);

        if (isErrorsObject(returned)) {
            await setErrors(returned);

            return { ...errors.value };
        }
    };

    // Macro do compilador: vira `__expose(...)` sobre o contexto já capturado, e o pai
    // só lê o ref depois de o Suspense resolver.
    // eslint-disable-next-line vue/no-expose-after-await -- ver acima
    defineExpose({ model, validate, submit, setErrors, errors });
</script>