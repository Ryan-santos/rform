import { ref, type Ref } from "vue";

import { tryUseNuxtApp } from "#app";

import { normalize, pluralOf, type Tr, type TrValue } from "../utils/i18n";

const LITERAL = "~~";

/**
 * The shape the bridge needs from `@nuxtjs/i18n`. Structural on purpose: the
 * module is optional, so there is no type to import and nothing to declare as a
 * dependency.
 */
type Bridge = {
    locale: Ref<string>;
    t: (key: string, params?: unknown, options?: unknown) => string;
};

/**
 * Only reached when this file is loaded with no `$i18n` around — a unit test,
 * or a component mounted outside a Nuxt app.
 */
const outside = ref("");

const isBridge = (candidate: unknown): candidate is Bridge =>
    !!candidate &&
    typeof (candidate as Bridge).t === "function" &&
    !!(candidate as Bridge).locale &&
    "value" in (candidate as Bridge).locale;

const current = (): Bridge | undefined => {
    try {
        const bridge = (tryUseNuxtApp() as { $i18n?: unknown } | null | undefined)?.$i18n;

        return isBridge(bridge) ? bridge : undefined;
    } catch {
        return undefined;
    }
};

/**
 * The store already holds the module's own packs under `rform`, registered
 * through `i18n:registerModule` — so `rform.fields.array.add` resolves with no
 * special casing here. A literal has to say so with `~~`, and a plain string
 * that is not a key falls through to vue-i18n's own *missing key* warning in
 * dev, which is deliberate noise.
 */
const run = (bridge: Bridge | undefined, input: TrValue | null | undefined): string => {
    const { key, params } = normalize(input);

    if (key.startsWith(LITERAL)) {
        return key.slice(LITERAL.length).trimStart();
    }

    if (!bridge) {
        return key;
    }

    if (params === undefined) {
        return bridge.t(key);
    }

    if (typeof params === "number") {
        return bridge.t(key, params);
    }

    const choice = pluralOf(params);

    // `t(key, named, plural)` — the same three-argument overload vue-i18n
    // documents, and the same fourth-argument position the core `translate` uses.
    return choice === undefined ? bridge.t(key, params) : bridge.t(key, params, choice);
};

export const useTr = (): { tr: Tr; locale: Ref<string> } => {
    const bridge = current();

    return {
        locale: bridge?.locale ?? outside,
        tr: (input) => run(bridge, input)
    };
};

export const tr: Tr = (input) => run(current(), input);

export default { tr, useTr };