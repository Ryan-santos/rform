import type { Plugin } from "vite";

/**
 * Vite ids are always forward-slashed; `resolve()` and `join()` hand back
 * backslashes on Windows. Comparing the two raw makes every user root miss.
 */
const normalize = (path: string) => path.split("\\").join("/");

/**
 * An optional type-argument list, captured so the rewrite can put it back.
 * Running before the Vue plugin means seeing `useUtilProps<Props>()` with the
 * generic still on it — a pattern that demanded `(` right after the name found
 * nothing to rewrite. One level of nesting covers `<Props<M>>`.
 */
const GENERIC = String.raw`\s*(<[^<>]*(?:<[^<>]*>[^<>]*)*>)?\s*`;

/** A call's arguments, tolerating one level of nested parentheses. */
const ARGS = String.raw`\(([^()]*(?:\([^()]*\)[^()]*)*)\)`;

/**
 * Rewrites `useInjection(props)` into `useInjection(props, undefined, "Text")`,
 * so a component learns its own name without repeating it in the file.
 *
 * @param roots Directories whose `.vue` files get the name injected — the
 * module's own components plus `app/rform/{fields,utils}`.
 */
export default (roots: string[]): Plugin => {
    const prefixes = roots.map((root) => `${normalize(root).replace(/\/+$/, "")}/`);

    return {
        name: "rform-component-name-injector",

        /**
         * Before `@vitejs/plugin-vue`, not after. Running after, the bare `.vue`
         * id has already been compiled down to an import of
         * `?vue&type=script&setup=true` — the composable call lives in that
         * sub-request, and rewriting the leftover wrapper changes nothing.
         * Running first, the descriptor plugin-vue parses is the rewritten one.
         */
        enforce: "pre",

        transform(code, id) {
            const path = normalize(id);

            if (!path.endsWith(".vue") || !prefixes.some((prefix) => path.startsWith(prefix))) {
                return;
            }

            const fileName = path.split("/").pop()!.replace(".vue", "");

            const replaceCode = code
                // Global on purpose: a second, unrewritten call would silently
                // fall through to another component's defaults.
                .replace(
                    new RegExp(`\\buseInjection${GENERIC}${ARGS}`, "g"),
                    (match, generic = "", params) => {
                        const paramCount = params.trim()
                            ? (params.match(/,(?![^()]*\))/g) || []).length + 1
                            : 0;

                        switch (paramCount) {
                            case 1:
                                return `useInjection${generic}(${params}, undefined, "${fileName}")`;
                            case 2:
                                return `useInjection${generic}(${params}, "${fileName}")`;
                            default:
                                return match;
                        }
                    }
                )
                .replace(
                    new RegExp(`\\buseUtilProps${GENERIC}${ARGS}`, "g"),
                    (_match, generic = "") => `useUtilProps${generic}("${fileName}")`
                );

            if (replaceCode !== code) {
                return {
                    code: replaceCode,
                    map: null
                };
            }
        }
    };
};