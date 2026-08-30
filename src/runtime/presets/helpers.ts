import type { ZodType } from "zod";

/**
 * Shared by the built-in rule presets. Lives outside `rules/` on purpose —
 * every module inside `rules/` is scanned as a preset.
 */

export const text = (value: unknown) =>
    typeof value === "string" || typeof value === "number" ? String(value) : "";

export const digits = (value: unknown) => text(value).replace(/[^0-9]/g, "");

/**
 * Format rules skip blank input so `required` stays the single owner of
 * emptiness — otherwise every field would report two errors at once.
 */
export const isBlank = (value: unknown) =>
    value === undefined
    || value === null
    || (typeof value === "string" && value.trim() === "");

export const allSameDigit = (value: string) => /^(\d)\1+$/.test(value);

export const checkDigit = (base: string, startWeight: number) => {
    let sum = 0;
    let weight = startWeight;

    for (const char of base) {
        sum += Number(char) * weight;
        weight -= 1;

        if (weight < 2) {
            weight = 9;
        }
    }

    const rest = sum % 11;

    return rest < 2 ? 0 : 11 - rest;
};

/**
 * Runs a schema and hands back the first issue message, which is the shape a
 * `validation` returns. Every built-in rule goes through here, so the message a
 * user overrides on the schema is the message the field shows.
 */
export const check = (schema: ZodType, value: unknown): string | undefined => {
    const result = schema.safeParse(value);

    return result.success ? undefined : result.error.issues[0]?.message;
};
