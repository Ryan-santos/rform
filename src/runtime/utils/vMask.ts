import { MaskInput, type MaskInputOptions } from "maska";
import type { Directive, DirectiveBinding } from "vue";

type Target = HTMLInputElement | HTMLTextAreaElement;

export type MaskBinding = MaskInputOptions | string | null | undefined;

const instances = new WeakMap<Target, MaskInput>();

const isField = (el: HTMLElement): el is Target =>
    el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

const teardown = (el: Target) => {
    instances.get(el)?.destroy();
    instances.delete(el);
};

const apply = (el: HTMLElement, binding: DirectiveBinding<MaskBinding>) => {
    if (!isField(el)) {
        console.warn(
            "[rform] v-mask must sit on the <input> or <textarea> itself; it does not look inside.",
            el
        );
        return;
    }

    if (el.type === "file") {
        return;
    }

    if (binding.value === null || binding.value === undefined) {
        teardown(el);
        return;
    }

    const options =
        typeof binding.value === "string" ? { mask: binding.value } : { ...binding.value };

    const instance = instances.get(el);

    if (instance) {
        instance.update(options);
        return;
    }

    // `MaskaTarget` é tipado só para input; o runtime é agnóstico de elemento.
    instances.set(el, new MaskInput(el as HTMLInputElement, options));
};

/**
 * A diretiva de máscara do módulo — não a do maska, que ignora `<textarea>`. Liga
 * só no elemento em que está, sem procurar descendente; ver "`v-mask` é nosso, não
 * o `v-maska`" no `.claude/CLAUDE.md`.
 *
 * @example <input v-mask="{ mask: '###.###.###-##' }">
 */
export default {
    mounted: apply,
    updated: apply,
    unmounted(el: HTMLElement) {
        if (isField(el)) {
            teardown(el);
        }
    }
} satisfies Directive<HTMLElement, MaskBinding>;