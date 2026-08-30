import { z } from "zod";
import { defineRule, type RuleContext } from "../../utils/definePreset";
import { check, isBlank } from "../helpers";

/**
 * A number is compared by value, everything else by length — so the schema is
 * picked from the value, not from the field.
 */
const schema = (value: unknown, min: number) => {
    if (typeof value === "number") {
        return z.number().min(min, `Valor mínimo: ${min}.`);
    }

    const message = `Mínimo de ${min} caracteres.`;

    return Array.isArray(value)
        ? z.array(z.unknown()).min(min, message)
        : z.string().min(min, message);
};

export default defineRule({
    validation: ({ value, min }: RuleContext<{ min: number }>) =>
        isBlank(value) ? undefined : check(schema(value, min), value)
});
