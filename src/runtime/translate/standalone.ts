import { createCoreContext, translate, type CoreContext } from "@intlify/core";
import { ref, type Ref } from "vue";

import { tryUseNuxtApp, useState } from "#app";
import { defaultLocale, locales } from "#rform/locales";

import { matchLocale, normalize, pluralOf, type Tr, type TrValue } from "../utils/i18n";

const PREFIX = "rform.";

const packs = locales as Record<string, unknown>;
const codes = Object.keys(packs);

/**
 * Um contexto para o processo inteiro — compilar mensagem é a parte cara e o
 * intlify cacheia por contexto; o locale é trocado a cada chamada. O cast para
 * `CoreContext<string>` evita as sobrecargas de `translate` andarem recursivamente
 * pelo tipo literal dos packs. Ver "As duas rotas" no `.claude/CLAUDE.md`.
 */
const context = createCoreContext({
    locale: defaultLocale,
    fallbackLocale: defaultLocale,
    messages: packs as never,
    missingWarn: false,
    fallbackWarn: false
}) as CoreContext<string>;

// Só para um componente montado fora de app Nuxt. Dentro, o locale mora no
// `useState`, que é por request.
const outside = ref(defaultLocale);

/**
 * A rota sem ponte: só `rform.*` chega ao resolvedor, todo o resto volta intacto —
 * `~~Nome` inclusive, porque não há contra o que resolver uma chave do app. Ver "A
 * assimetria do `~~`" no `.claude/CLAUDE.md`.
 */
const run = (locale: string, input: TrValue | null | undefined): string => {
    const { key, params } = normalize(input);

    if (!key.startsWith(PREFIX)) {
        return key;
    }

    const path = key.slice(PREFIX.length);

    context.locale = matchLocale(locale, codes) ?? defaultLocale;

    // O terceiro argumento É o objeto de params cru; a escolha de plural é o
    // **quarto**, e sem ele o ramo 0 sai sempre.
    const message =
        params === undefined
            ? translate(context, path)
            : typeof params === "number"
              ? translate(context, path, params)
              : pluralOf(params) === undefined
                ? translate(context, path, params)
                : translate(context, path, params, pluralOf(params)!);

    // Uma falta volta como o caminho pelado; devolver a chave inteira mantém uma
    // mensagem faltando legível como uma.
    return typeof message === "string" && message !== path ? message : key;
};

// O `useState` exige app Nuxt no contexto, e `tr` também é chamado de dentro de uma
// `validation`, muito depois de qualquer setup — cair de volta é o ponto.
const currentLocale = (): Ref<string> => {
    try {
        return tryUseNuxtApp() ? useState<string>("rform-locale", () => defaultLocale) : outside;
    } catch {
        return outside;
    }
};

/** `{ tr, locale }` do resolvedor próprio, sobre os packs de `#rform/locales`. */
export const useTr = (): { tr: Tr; locale: Ref<string> } => {
    const locale = currentLocale();

    return { locale, tr: (input) => run(locale.value, input) };
};

/** O mesmo tradutor, fora de componente — é o que `utils/tr.ts` reexporta. */
export const tr: Tr = (input) => run(currentLocale().value, input);

export default { tr, useTr };