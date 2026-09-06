import { ref, type Ref } from "vue";

import { tryUseNuxtApp } from "#app";

import { normalize, pluralOf, type Tr, type TrValue } from "../utils/i18n";

const LITERAL = "~~";

/**
 * A forma que a ponte precisa do i18n do app. Estrutural de propósito: o módulo é
 * opcional, então não há tipo a importar nem dependência a declarar.
 */
type Bridge = {
    locale: Ref<string>;
    t: (key: string, params?: unknown, options?: unknown) => string;
};

// Só alcançado sem `$i18n` por perto — um teste unitário, ou um `mount()` fora de
// um app Nuxt.
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
 * A rota com ponte: `~~` é literal, todo o resto vai pro `t` do app — os packs do
 * módulo já moram no store dele sob `rform`. String solta que não é chave cai no
 * aviso de *missing key* do vue-i18n, e esse barulho é de propósito. Ver "As duas
 * rotas" no `.claude/CLAUDE.md`.
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

    // `t(key, named, plural)` — a sobrecarga de três argumentos que o vue-i18n
    // documenta, na mesma posição em que o motor sem ponte pede o plural.
    return choice === undefined ? bridge.t(key, params) : bridge.t(key, params, choice);
};

/** `{ tr, locale }` da ponte. Sem `$i18n` por perto devolve a chave e um ref vazio. */
export const useTr = (): { tr: Tr; locale: Ref<string> } => {
    const bridge = current();

    return {
        locale: bridge?.locale ?? outside,
        tr: (input) => run(bridge, input)
    };
};

/** O mesmo tradutor, fora de componente — é o que `utils/tr.ts` reexporta. */
export const tr: Tr = (input) => run(current(), input);

export default { tr, useTr };