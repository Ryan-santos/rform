import { isZodType, zodToFn } from "./zod";

/**
 * Every validator takes a single object: `value`, `form`, and the preset's own
 * named arguments alongside them. `never` keeps any concrete context shape
 * assignable here.
 */
export type BaseContext = { value: unknown, form: unknown };

type Validation = (context: never) => string | void | Promise<string | void>;

export type RulePreset = {
    available?: readonly string[]
    validation: Validation
};

export type Rules = Record<string, RulePreset>;

export type RuleFn = Validation;

export type RuleArgs = Record<string, unknown>;

export type RuleRef =
    | string
    | ({ name: string } & RuleArgs)
    | RuleFn
    | object;

export type Resolved = (value: unknown, form: unknown) => Promise<string | void>;

const call = (
    fn: Validation,
    context: RuleArgs
) => (fn as (c: RuleArgs) => string | void | Promise<string | void>)(context);

const fromPreset = (
    name: string,
    args: RuleArgs,
    rules: Rules,
    field?: string
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

    // `value` and `form` last: an argument named after either one cannot shadow
    // what the field actually holds.
    return async (value, form) => call(preset.validation, { ...args, value, form });
};

const single = (ref: RuleRef, rules: Rules, field?: string): Resolved => {
    if (typeof ref === "string") {
        return fromPreset(ref, {}, rules, field);
    }

    if (typeof ref === "function") {
        return async (value, form) => call(ref as Validation, { value, form });
    }

    if (isZodType(ref)) {
        const fn = zodToFn(ref)!;
        return async value => fn(value);
    }

    if (typeof ref === "object" && "name" in ref && typeof ref.name === "string") {
        const { name, ...args } = ref as { name: string } & RuleArgs;

        return fromPreset(name, args, rules, field);
    }

    throw new Error(`[rform] cannot resolve rule: ${typeof ref}`);
};

/**
 * Normalises every accepted `rule` shape — preset name, `{ name, ...args }`,
 * plain function, zod schema, or an array of those — into one async validator.
 *
 * Preset lookup happens eagerly so a typo fails loudly instead of silently
 * skipping validation.
 */
export default function resolveRule (
    ref: RuleRef | readonly RuleRef[] | null | undefined,
    rules: Rules,
    field?: string
): Resolved | undefined {
    if (ref === null || ref === undefined) {
        return undefined;
    }

    if (Array.isArray(ref)) {
        const resolved = ref.map(item => single(item, rules, field));

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
};
