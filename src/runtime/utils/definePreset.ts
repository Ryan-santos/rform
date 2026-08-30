import type { MaskInputOptions } from "maska";
import type { FieldType } from "#rform/types/fields";
import type { BaseContext, RulePreset } from "./resolveRule";

/**
 * The object a `validation` receives. `value` and `form` come for free; the
 * type parameter is what this preset adds on top:
 *
 * ```ts
 * validation ({ value, uf }: RuleContext<{ uf: string }>) { … }
 * ```
 *
 * It narrows as well as adds — `RuleContext<{ value: string, uf: string }>`
 * types `value` as a string, because `unknown & string` is `string`. Whatever
 * is left after `value` and `form` is exactly what the `rule` prop demands as
 * `{ name, ...args }`.
 */
export type RuleContext<T extends object = Record<never, never>> = BaseContext & T;

/**
 * Authoring shape of a rule preset. `available` is narrowed to the field types
 * that actually exist, so a typo ("txt") fails at the definition instead of
 * silently never matching a component.
 */
export type RuleDefinition = Omit<RulePreset, "available"> & {
    /** Field types this rule serves. Omit it to serve every field. */
    available?: readonly FieldType[]
};

/**
 * `const` type parameters keep `available: ["text"]` a literal tuple, which is
 * what lets the generated types filter presets per component.
 */
export const defineRule = <const T extends RuleDefinition>(rule: T): T => rule;

export const defineMask = <const T extends MaskInputOptions>(mask: T): T => mask;

export default { defineRule, defineMask };
