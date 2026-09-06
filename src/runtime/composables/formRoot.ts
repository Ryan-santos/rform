import { inject, provide, type InjectionKey, type Ref } from "vue";

type FormRoot = Ref<unknown>;

const formRootKey: InjectionKey<FormRoot> = Symbol("form-root");

/**
 * Só o Form provê — Array e Object de propósito não, para o `form` que uma
 * `validation` recebe ser sempre o form inteiro, nunca o ramo.
 */
export function defineFormRoot(model: FormRoot): FormRoot {
    provide(formRootKey, model);
    return model;
}

/** O model do Form ancestral, ou `undefined` num campo usado solto. */
export function injectFormRoot(): FormRoot | undefined {
    return inject<FormRoot | undefined>(formRootKey, undefined);
}

export default { defineFormRoot, injectFormRoot };