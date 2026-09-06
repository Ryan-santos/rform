/**
 * Duck-typed rather than `instanceof`: the schema a user hands to `rule` may
 * come from a different copy of zod than the one this module resolves, and
 * `instanceof` would say no to a perfectly good schema.
 */
export const isZodType = (
    value: unknown
): value is {
    safeParse: (input: unknown) => {
        success: boolean;
        error?: { issues: Array<{ message: string }> };
    };
} =>
    !!value &&
    typeof value === "object" &&
    "safeParse" in value &&
    typeof (value as { safeParse: unknown }).safeParse === "function";

export const zodToFn = (schema: unknown) => {
    if (!isZodType(schema)) {
        return undefined;
    }

    return (value: unknown): string | void => {
        const result = schema.safeParse(value);

        if (!result.success) {
            return result.error?.issues[0]?.message;
        }
    };
};

export default { isZodType, zodToFn };