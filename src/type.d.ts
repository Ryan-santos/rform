import type { Rule } from "#rform/types/presets";
import type { TrInput } from "#rform/types/tr";

export type { TrInput };

/**
 * A forma do `defaults` de qualquer componente. `default` é opcional para
 * `defineDefaults` tipar um util também — um Label tem `ui` e não tem model.
 *
 * `text` é a chave que marca o que é chave de tradução do módulo, e continua um
 * objeto **aninhado** o caminho inteiro; `label` e `placeholder` são as duas
 * exceções que moram no topo por contrato. Ver "`defaults.text` é o marcador" no
 * `.claude/CLAUDE.md`.
 */
export interface Base {
    ui: Record<string, unknown> | string;
    default?: unknown;
    text?: TextSource;
    label?: unknown;
    placeholder?: unknown;
}

/** A forma de autoria de `defaults.text`: grupos aninhados de chaves de mensagem. */
export interface TextSource {
    [key: string]: string | TextSource;
}

export type ConvertNeverToUnknown<T> = T extends never[]
    ? unknown[]
    : T extends never
      ? unknown
      : T extends Array<infer U>
        ? Array<ConvertNeverToUnknown<U>>
        : T extends object
          ? {
                [K in keyof T]: ConvertNeverToUnknown<T[K]>;
            }
          : T;

/**
 * O que um slot nomeado do schema recebe do RForm / RDynamic. Tipado aqui para o
 * escopo sobreviver ao salto pelos bindings dinâmicos `#[slotName]`.
 */
export type SlotScope = {
    fieldName: string | number;
    rule?: Rule;
};

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Record<unknown, unknown> ? DeepPartial<T[P]> : T[P];
};

/**
 * O inverso do `DeepPartial`: o que um `ui` parcial vira depois de mesclado sobre
 * os defaults completos — toda chave presente, em toda profundidade.
 */
export type DeepRequired<T> = T extends object
    ? { [P in keyof T]-?: DeepRequired<NonNullable<T[P]>> }
    : T;

/**
 * Espelha a árvore de `defaults.text` na prop que a carrega, virando toda folha um
 * `TrInput` e todo nível opcional. Mapped type de propósito, nunca condicional no
 * nível da prop — ver "O `Element` não deriva os props de texto" no
 * `.claude/CLAUDE.md`.
 *
 * @example TextProp<{ hint: string, teste: { a: string } }>
 * // → { text?: { hint?: TrInput, teste?: { a?: TrInput } } }
 */
export type TextTree<T> = {
    [K in keyof T]?: T[K] extends string ? TrInput : TextTree<T[K]>;
};

export type TextProp<T> = {
    text?: TextTree<T>;
};

/**
 * O mesmo componente visto do próprio `defaults` em vez do call site: igual a
 * `Props`, menos `text`, que ainda guarda o sufixo cru que o `prefixText` não
 * expandiu. Ver "`WithTextSource<P>`" no `.claude/CLAUDE.md`.
 */
export type WithTextSource<P> = Omit<P, "text"> & { text?: TextSource };

/**
 * As props que todo campo tem. `C` é o field type ("text", "color", …) e filtra
 * quais presets o `rule` aceita, pelo `available` de cada um.
 *
 * `text` está ausente de propósito: cada componente o intersecciona com
 * `TextProp<typeof defaults.text>`, porque só ele sabe a forma da própria árvore.
 *
 * `error` é `TrInput` como `label` e `placeholder`, mas só na entrada: quem resolve é
 * o `useField`, e o que sai do merger é sempre a mensagem pronta.
 */
export type Element<OBJ extends Base = Base, C = any, D = ConvertNeverToUnknown<OBJ["default"]>> = {
    name?: string | number;
    error?: TrInput;
    required?: boolean;
    rule?: Rule<C>;
    loading?: boolean;
    default?: D;
    ui?: DeepPartial<OBJ["ui"]>;
    modelValue?: D;
    "onUpdate:modelValue"?: <T extends D>($event: T) => void;
};

/**
 * O que o app empurra para dentro do formulário: erros vindos de fora, na forma
 * que uma API produz. Aninhado, já pontilhado ou os dois misturados — quem
 * achata é o `flattenErrors`.
 */
export type FormErrors = {
    [key: string]: string | string[] | FormErrors;
};