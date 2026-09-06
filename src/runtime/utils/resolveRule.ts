import { isZodType, zodToFn } from "./zod";

/**
 * Todo validador recebe um objeto só: `value`, `form` e os args nomeados do preset
 * ao lado. O tradutor **não** está aqui — uma rule chega ao locale ativo pelo
 * `trRule` importado, e o contexto fica sendo só o que o campo de fato tem.
 */
export type BaseContext = { value: unknown; form: unknown };

type Validation = (context: never) => string | void | Promise<string | void>;

export type RulePreset = {
    available?: readonly string[];
    validation: Validation;
};

export type Rules = Record<string, RulePreset>;

export type RuleFn = Validation;

export type RuleArgs = Record<string, unknown>;

export type RuleRef = string | ({ name: string } & RuleArgs) | RuleFn | object;

export type Resolved = (value: unknown, form: unknown) => Promise<string | void>;

const call = (fn: Validation, context: RuleArgs) =>
    (fn as (c: RuleArgs) => string | void | Promise<string | void>)(context);

const fromPreset = (
    name: string,
    args: RuleArgs,
    rules: Rules,
    field: string | undefined
): Resolved => {
    const preset = rules[name];

    if (!preset) {
        throw new Error(
            `[rform] unknown rule preset "${name}". Create app/rform/presets/rules/${name}.ts or check the spelling.`
        );
    }

    if (field && preset.available && !preset.available.includes(field)) {
        console.warn(
            `[rform] rule preset "${name}" is only available for [${preset.available.join(", ")}], but it was used on a "${field}" field.`
        );
    }

    // `value` e `form` por último: um arg com esses nomes não pode sombrear o que o
    // campo realmente tem.
    return async (value, form) => call(preset.validation, { ...args, value, form });
};

const single = (ref: RuleRef, rules: Rules, field: string | undefined): Resolved => {
    if (typeof ref === "string") {
        return fromPreset(ref, {}, rules, field);
    }

    if (typeof ref === "function") {
        return async (value, form) => call(ref as Validation, { value, form });
    }

    if (isZodType(ref)) {
        const fn = zodToFn(ref)!;
        return async (value) => fn(value);
    }

    if (typeof ref === "object" && "name" in ref && typeof ref.name === "string") {
        const { name, ...args } = ref as { name: string } & RuleArgs;

        return fromPreset(name, args, rules, field);
    }

    throw new Error(`[rform] cannot resolve rule: ${typeof ref}`);
};

/**
 * Normaliza toda forma aceita em `rule` — nome de preset, `{ name, ...args }`,
 * função, schema zod ou um array deles — num validador async só. O preset é
 * procurado na hora, para um typo falhar alto em vez de pular a validação calado.
 *
 * @example resolveRule(["required", { name: "min", min: 3 }], rules, "text")
 */
export default function resolveRule(
    ref: RuleRef | readonly RuleRef[] | null | undefined,
    rules: Rules,
    field?: string
): Resolved | undefined {
    if (ref === null || ref === undefined) {
        return undefined;
    }

    if (Array.isArray(ref)) {
        const resolved = ref.map((item) => single(item, rules, field));

        return async (value, form) => {
            for (const validate of resolved) {
                const error = await validate(value, form);

                if (error) {
                    return error;
                }
            }
        };
    }

    return single(ref as RuleRef, rules, field);
}