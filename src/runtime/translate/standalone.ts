import { createCoreContext, translate, type CoreContext } from "@intlify/core";
import { ref, type Ref } from "vue";

import { tryUseNuxtApp, useState } from "#app";
import { defaultLocale, locales } from "#rform/locales";

import { matchLocale, normalize, pluralOf, type Tr, type TrValue } from "../utils/i18n";

const PREFIX = "rform.";

const packs = locales as Record<string, unknown>;
const codes = Object.keys(packs);

/**
 * One context for the whole process: compiling a message is the expensive part
 * and intlify caches it per context. The locale is swapped per call instead,
 * which is what makes a `tr` inside a template re-render on a language change.
 *
 * Cast to the plain `CoreContext<string>` rather than left inferred: with the
 * literal `packs` type, `translate`'s overloads walk that type recursively
 * (`PickupPaths`/`PickupKeys`) and TS gives up with "Type instantiation is
 * excessively deep and possibly infinite". The module's own keys are looked up
 * by hand-built path (`path`, below) — the generic key-completion `translate`
 * offers is not something this file's call site benefits from.
 */
const context = createCoreContext({
    locale: defaultLocale,
    fallbackLocale: defaultLocale,
    messages: packs as never,
    missingWarn: false,
    fallbackWarn: false
}) as CoreContext<string>;

/**
 * Only for a component mounted outside a Nuxt app — a plain `mount()` in a
 * test. Inside Nuxt the locale lives in `useState`, which is per request.
 */
const outside = ref(defaultLocale);

/**
 * Decision 9: without a bridge there is nothing to resolve an app key against,
 * so anything that is not a module key — `~~Nome` included — comes back
 * untouched. Only `rform.*` reaches the resolver.
 */
const run = (locale: string, input: TrValue | null | undefined): string => {
    const { key, params } = normalize(input);

    if (!key.startsWith(PREFIX)) {
        return key;
    }

    const path = key.slice(PREFIX.length);

    context.locale = matchLocale(locale, codes) ?? defaultLocale;

    /**
     * `translate`'s third argument IS the named object or the plural count —
     * not a `{ named }`/`{ plural }` wrapper, which reads as a param literally
     * called "named". The plural choice is the **fourth** argument, and without
     * it intlify stays on branch 0 whatever the count.
     */
    const message =
        params === undefined
            ? translate(context, path)
            : typeof params === "number"
              ? translate(context, path, params)
              : pluralOf(params) === undefined
                ? translate(context, path, params)
                : translate(context, path, params, pluralOf(params)!);

    /**
     * A miss comes back as the bare path. Handing the full key back instead
     * keeps a missing module message legible as one.
     */
    return typeof message === "string" && message !== path ? message : key;
};

/**
 * `useState` needs a Nuxt app in context, and `tr` is also called from a rule
 * validation, which runs long after any setup. Falling back rather than
 * throwing is the point.
 */
const currentLocale = (): Ref<string> => {
    try {
        return tryUseNuxtApp() ? useState<string>("rform-locale", () => defaultLocale) : outside;
    } catch {
        return outside;
    }
};

export const useTr = (): { tr: Tr; locale: Ref<string> } => {
    const locale = currentLocale();

    return { locale, tr: (input) => run(locale.value, input) };
};

export const tr: Tr = (input) => run(currentLocale().value, input);

export default { tr, useTr };