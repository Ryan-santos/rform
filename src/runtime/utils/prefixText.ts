/**
 * `defaults.text` is the marker that says "these strings are translation keys
 * of the module". Without it, prefixing every string in `defaults` would turn
 * `Select.keyValue: "id"` into `"rform.fields.select.id"` and the field would
 * start looking for `option["rform.fields.select.id"]` — silently.
 *
 * The tree keeps its shape: `text: { button: "add" }` becomes
 * `text: { button: "rform.fields.array.add" }`, so a template reads
 * `tr(props.text.button)` and a nested group stays nested — the group's own key
 * joining the prefix, so `text.bytes.kb` reads `rform.fields.file.bytes.kb`.
 *
 * `label` and `placeholder` are the two exceptions that live at the top level
 * — an app passes them straight, so they cannot sit inside `text` — but a value
 * the *component itself* declared is still a module message, so it is prefixed
 * too. An empty string is left alone: it is the "nothing to render" sentinel,
 * and `rform.fields.text.` is not a key.
 *
 * The prefixing runs **before** the merger, which is what makes provenance
 * free: whatever a prop or `app/rform/defaults.ts` passes replaces the prefixed
 * value whole, so it stays raw.
 */

/** Where the component lives, which is also where its messages live. */
export type TextScope = "fields" | "utils";

type Tree = { [key: string]: string | Tree };

const walk = (tree: Tree, prefix: string): Tree => {
    const out: Tree = {};

    for (const [key, value] of Object.entries(tree)) {
        /**
         * A group carries its own key into the prefix, so the tree mirrors the
         * pack: `text.bytes.kb = "kb"` is `rform.fields.file.bytes.kb`. Without
         * it the nesting would be shape for the prop and nothing for the key,
         * and every leaf under a group would have to restate the path.
         */
        out[key] =
            typeof value === "string" ? `${prefix}${value}` : walk(value, `${prefix}${key}.`);
    }

    return out;
};

/** The two top-level keys that carry a message without living in `text`. */
const LOOSE = ["label", "placeholder"] as const;

export default function prefixText<T extends Record<string, unknown>>(
    defaults: T,
    componentName: string,
    scope: TextScope
): Record<string, unknown> {
    const prefix = `rform.${scope}.${componentName.toLowerCase()}.`;

    const out: Record<string, unknown> = { ...defaults };

    const text = out.text as Tree | undefined;

    if (text) {
        out.text = walk(text, prefix);
    }

    for (const key of LOOSE) {
        const value = out[key];

        if (typeof value === "string" && value !== "") {
            out[key] = `${prefix}${value}`;
        }
    }

    return out;
}