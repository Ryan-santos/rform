import { z } from "zod";

import { defineRule, type RuleContext } from "../../utils/definePreset";
import { trRule } from "../../utils/tr";
import { check, isBlank } from "../helpers";

/**
 * A number is compared by value, everything else by length — so the schema is
 * picked from the value, not from the field. Two messages, for the same reason.
 *
 * The length message is a plural, and the count that chooses the form is the
 * same `max` it interpolates — the engine reads it out of the named object.
 */
const schema = (value: unknown, max: number) => {
    if (typeof value === "number") {
        return z.number().max(max, trRule({ key: "max.number", params: { max } }));
    }

    const message = trRule({ key: "max.length", params: { max } });

    return Array.isArray(value)
        ? z.array(z.unknown()).max(max, message)
        : z.string().max(max, message);
};

export default defineRule({
    validation: ({ value, max }: RuleContext<{ max: number }>) =>
        isBlank(value) ? undefined : check(schema(value, max), value)
});