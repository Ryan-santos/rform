import { z } from "zod";
import { defineRule, type RuleContext } from "../../utils/definePreset";
import { check } from "../helpers";

/**
 * Wider than `isBlank`: `false` and `[]` are filled values everywhere else, but
 * an unchecked switch and an empty list are exactly what this rule exists for.
 * Zero is not empty.
 */
const schema = z.custom<unknown>(value => !(
    value === undefined
    || value === null
    || value === false
    || (typeof value === "string" && value.trim() === "")
    || (Array.isArray(value) && value.length === 0)
), "Campo obrigatório.");

export default defineRule({
    validation: ({ value }: RuleContext) => check(schema, value)
});
