import { z } from "zod";
import { defineRule, type RuleContext } from "../../utils/definePreset";
import { check, isBlank } from "../helpers";

/**
 * A number is compared by value, everything else by length — so the schema is
 * picked from the value, not from the field.
 */
const schema = (value: unknown, max: number) => {
    if (typeof value === "number") {
        return z.number().max(max, `Valor máximo: ${max}.`);
    }

    const message = `Máximo de ${max} caracteres.`;

    return Array.isArray(value)
        ? z.array(z.unknown()).max(max, message)
        : z.string().max(max, message);
};

export default defineRule({
    validation: ({ value, max }: RuleContext<{ max: number }>) =>
        isBlank(value) ? undefined : check(schema(value, max), value)
});
