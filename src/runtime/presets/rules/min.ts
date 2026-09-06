import { z } from "zod";

import { defineRule, type RuleContext } from "../../utils/definePreset";
import { trRule } from "../../utils/tr";
import { check, isBlank } from "../helpers";

/**
 * A number is compared by value, everything else by length — so the schema is
 * picked from the value, not from the field. Two messages, for the same reason.
 *
 * The length message is a plural, and the count that chooses the form is the
 * same `min` it interpolates — the engine reads it out of the named object.
 */
const schema = (value: unknown, min: number) => {
    if (typeof value === "number") {
        return z.number().min(min, trRule({ key: "min.number", params: { min } }));
    }

    const message = trRule({ key: "min.length", params: { min } });

    return Array.isArray(value)
        ? z.array(z.unknown()).min(min, message)
        : z.string().min(min, message);
};

export default defineRule({
    validation: ({ value, min }: RuleContext<{ min: number }>) =>
        isBlank(value) ? undefined : check(schema(value, min), value)
});