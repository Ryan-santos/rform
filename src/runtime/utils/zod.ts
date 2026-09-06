/**
 * Duck typing em vez de `instanceof`: o schema que o app passa em `rule` pode vir
 * de outra cópia do zod, e o `instanceof` recusaria um schema perfeitamente bom.
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

/**
 * Adapta um schema zod à função de validação do campo: `undefined` se não for um,
 * senão a mensagem do primeiro issue.
 */
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