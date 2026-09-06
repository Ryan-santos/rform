import type { ZodType } from "zod";

// Compartilhado pelas rules embutidas. Mora fora de `rules/` de propósito: todo
// módulo lá dentro é escaneado como preset.

/** Coage a string o que der; o resto vira `""`. */
export const text = (value: unknown) =>
    typeof value === "string" || typeof value === "number" ? String(value) : "";

/** Só os dígitos do valor — é o que as rules de documento comparam. */
export const digits = (value: unknown) => text(value).replace(/[^0-9]/g, "");

/**
 * As rules de formato saem cedo por aqui para `required` continuar dona sozinha da
 * vacuidade — senão todo campo reportaria dois erros de uma vez.
 */
export const isBlank = (value: unknown) =>
    value === undefined || value === null || (typeof value === "string" && value.trim() === "");

/** `111.111.111-11` e irmãos passam no dígito verificador, e não são documentos. */
export const allSameDigit = (value: string) => /^(\d)\1+$/.test(value);

/** Dígito verificador módulo 11, o de CPF e CNPJ. O peso decresce e volta a 9. */
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
 * Roda um schema e devolve a mensagem do primeiro issue, que é a forma que uma
 * `validation` retorna — é isso que torna a mensagem do preset a do campo.
 */
export const check = (schema: ZodType, value: unknown): string | undefined => {
    const result = schema.safeParse(value);

    return result.success ? undefined : result.error.issues[0]?.message;
};