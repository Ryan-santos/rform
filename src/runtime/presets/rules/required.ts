import { z } from "zod";

import { defineRule, type RuleContext } from "../../utils/definePreset";
import { trRule } from "../../utils/tr";
import { check } from "../helpers";

/**
 * Wider than `isBlank`: `false` and `[]` are filled values everywhere else, but
 * an unchecked switch and an empty list are exactly what this rule exists for.
 * Zero is not empty.
 *
 * A factory, not a module-scope constant: the message is the active locale's,
 * and the locale can change without the page reloading.
 */
const schema = () =>
    z.custom<unknown>(
        (value) =>
            !(
                value === undefined ||
                value === null ||
                value === false ||
                (typeof value === "string" && value.trim() === "") ||
                (Array.isArray(value) && value.length === 0)
            ),
        trRule("required")
    );

export default defineRule({
    validation: ({ value }: RuleContext) => check(schema(), value)
});