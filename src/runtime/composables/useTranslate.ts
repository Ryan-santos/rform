import type { Ref } from "vue";

import { useTr } from "#rform/translate";

import type { Tr } from "../utils/i18n";

/**
 * `{ tr, locale }` for every field and util — `useInjection` and `useUtilProps`
 * call this, so no component writes an import for it.
 *
 * Which engine answers is decided at build time by `module.ts`, through the
 * exact `#rform/translate` alias: with `@nuxtjs/i18n` installed it is the
 * bridge, which reads the app's own store (the module's packs live there under
 * `rform`, registered through `i18n:registerModule`); without it, the module
 * resolves on its own over `#rform/locales` with `@intlify/core`. The bridge
 * body never writes that import, so an app with i18n does not pay for it.
 *
 * Either way `tr` reads `locale.value` on every call, so a call inside a
 * template tracks the ref and switching the language re-renders.
 */
export default function useTranslate(): { tr: Tr; locale: Ref<string> } {
    return useTr();
}