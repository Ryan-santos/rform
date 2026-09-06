import { MaskInput, type MaskInputOptions } from "maska";
import type { Directive, DirectiveBinding } from "vue";

type Target = HTMLInputElement | HTMLTextAreaElement;

export type MaskBinding = MaskInputOptions | string | null | undefined;

/**
 * maska's own `vMaska` bails on anything that is not an `<input>`
 * (`e instanceof HTMLInputElement ? e : e.querySelector("input")`), so a
 * `<textarea>` never gets bound. `MaskInput` itself only needs `value`,
 * `selectionStart` and an `input` event, all of which a textarea has — so this
 * directive drives it directly and covers both elements.
 *
 * It binds ONLY the element it sits on: no descendant lookup. maska's fallback
 * lets a wrapper (or a directive Vue forwards onto a component's root) hijack a
 * field another binding already owns, and makes mount and unmount resolve
 * different nodes, which leaks listeners. Resolving to `el` or nothing keeps
 * every hook talking about the same element for the binding's whole life.
 */
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

    // MaskaTarget is typed as HTMLInputElement only; the runtime is element-agnostic.
    instances.set(el, new MaskInput(el as HTMLInputElement, options));
};

export default {
    mounted: apply,
    updated: apply,
    unmounted(el: HTMLElement) {
        if (isField(el)) {
            teardown(el);
        }
    }
} satisfies Directive<HTMLElement, MaskBinding>;