import { inject, provide, type InjectionKey, type Ref } from "vue";

type FormRoot = Ref<unknown>;

const formRootKey: InjectionKey<FormRoot> = Symbol("form-root");

/**
 * Only the Form provides it — Array and Object deliberately do not, so a nested
 * field's `validation(value, form)` always sees the whole form, not its branch.
 */
export function defineFormRoot (model: FormRoot): FormRoot {
    provide(formRootKey, model);
    return model;
}

export function injectFormRoot (): FormRoot | undefined {
    return inject<FormRoot | undefined>(formRootKey, undefined);
}

export default { defineFormRoot, injectFormRoot };
