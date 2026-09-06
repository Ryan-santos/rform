import type { Base } from "#rform/types";

type UI = Base["ui"] | undefined;

/**
 * Prepends a component's hook class (`RField RText`, `RUtil RUtilsPlaceholder`)
 * to the top-most entry of its already merged `ui`, which is what gives the
 * resets in `src/runtime/style.css` something to select — on every field and
 * util, including one used **without** an `RForm` around it: `useField`
 * reads the parent with `inject(key, undefined)`, so a loose field is a
 * supported case, and the browser's autofill does not depend on `<form>`
 * either.
 *
 * Applied after `merger`, never declared among the defaults. `ui` is
 * overridable by contract and `mergerUI` reads `null` as "clear this key", so a
 * hook living in the defaults would leave with a `container: null` — and a
 * rewritten `container` would be at the mercy of whatever `twMerge` decides to
 * drop in a namespace that is not Tailwind's. Merging first and prepending
 * after keeps the class out of both.
 *
 * "Top-most" is the first entry holding classes rather than a nested group,
 * which is the root element's own everywhere here: `container` in a field,
 * `default` in the Placeholder, `ui` itself where it is a bare string. The
 * order is the one the component declared — `merger` seeds the result from its
 * `defaults` and `mergerUI` copies with a spread, so neither reorders.
 */
export default (ui: UI, hook: string | undefined): UI => {
    // `Form` and `Dynamic` have no hook: neither is a field, and `Form` writes
    // its own `RForm`.
    if (!hook) {
        return ui;
    }

    const prepend = (classes: unknown) => (classes ? `${hook} ${classes as string}` : hook);

    if (!ui || typeof ui === "string") {
        return prepend(ui);
    }

    const top = Object.keys(ui).find((key) => !ui[key] || typeof ui[key] === "string");

    /**
     * Nested groups only: a component that renders no element of its own has
     * nowhere to carry the class — and no reset to miss either.
     */
    return top ? { ...ui, [top]: prepend(ui[top]) } : ui;
};