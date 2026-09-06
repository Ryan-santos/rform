import type { Messages } from "#rform/types/locales";

/**
 * O que o `tr` aceita em runtime, antes de o `TrInput` gerado estreitar. Um número
 * em `params` é a escolha de plural, o mesmo que o `t(key, 3)` do vue-i18n.
 */
export type TrParams = Record<string, unknown> | number;

export type TrRef = { key: string; params?: TrParams };

export type TrValue = string | TrRef;

export type Tr = (input: TrValue | null | undefined) => string;

/**
 * A forma de entrada única que os dois motores leem. Mora aqui, e não ao lado do
 * `tr`, porque os dois motores a importam e `utils/tr.ts` importa os motores — a
 * outra direção fecharia ciclo.
 */
export const normalize = (
    input: TrValue | null | undefined
): { key: string; params?: TrParams } => {
    if (input === null || input === undefined) {
        return { key: "" };
    }

    if (typeof input === "string") {
        return { key: input };
    }

    return input.params === undefined
        ? { key: input.key }
        : { key: input.key, params: input.params };
};

/**
 * Casa um code com os packs disponíveis: exato primeiro (sem caixa), depois a
 * língua pelada, depois qualquer região dela.
 *
 * @example matchLocale("pt", ["pt-BR", "en"]) // → "pt-BR"
 */
export const matchLocale = (
    code: string | null | undefined,
    available: readonly string[]
): string | undefined => {
    if (!code) {
        return undefined;
    }

    const wanted = code.toLowerCase();
    const exact = available.find((entry) => entry.toLowerCase() === wanted);

    if (exact) {
        return exact;
    }

    const primary = wanted.split("-")[0] ?? wanted;

    return (
        available.find((entry) => entry.toLowerCase() === primary) ??
        available.find((entry) => entry.toLowerCase().split("-")[0] === primary)
    );
};

/**
 * De propósito não é o `DeepPartial` de `#rform/types`: aquele módulo alcança
 * `types/presets.d.ts`, que lê todo preset de volta, e um preset alcança
 * `resolveRule` — que importa este arquivo.
 */
type PartialMessages<T> = {
    [K in keyof T]?: T[K] extends string ? T[K] : PartialMessages<T[K]>;
};

/**
 * Tipa o `app/rform/locales/<code>.ts`. Parcial por desenho: um pack de três chaves
 * continua completo, porque mesmo code mescla com o default em vez de substituir.
 *
 * @example export default defineLocale({ presets: { rules: { required: "Preencha" } } });
 */
export const defineLocale = <const T extends PartialMessages<Messages>>(messages: T): T => messages;

/**
 * O primeiro valor numérico dos params serve de escolha de plural — é o que deixa
 * uma rule escrever `{ min }` uma vez e a mensagem interpolar e pluralizar por ele.
 * Sem isso os dois motores ficam no ramo 0 de `"a | b"`.
 */
export const pluralOf = (named: Record<string, unknown>): number | undefined =>
    Object.values(named).find((value): value is number => typeof value === "number");

export default {
    defineLocale,
    matchLocale,
    normalize,
    pluralOf
};