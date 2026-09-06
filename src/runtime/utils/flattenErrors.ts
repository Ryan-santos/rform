import type { FormErrors } from "#rform/types";

/**
 * Verdadeiro para o que serve de mapa de erros: objeto simples, nunca `null`,
 * array ou primitivo. É a rede de segurança do retorno do `onSubmit`.
 *
 * @example isErrorsObject({ nome: "Já existe" }) // → true
 */
export const isErrorsObject = (value: unknown): value is FormErrors =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Achata um mapa de erros no `id` pontilhado que o `useField` monta. Aceita as três
 * formas que uma API produz — aninhada, já pontilhada e as duas misturadas —, e um
 * `string[]` (estilo Laravel) vira o primeiro item.
 *
 * @example flattenErrors({ endereco: { cep: "inválido" } }) // → { "endereco.cep": "inválido" }
 * @example flattenErrors({ "itens.0.nome": ["obrigatório"] }) // → { "itens.0.nome": "obrigatório" }
 */
export default function flattenErrors(
    input: FormErrors | undefined,
    prefix = ""
): Record<string, string> {
    const out: Record<string, string> = {};

    if (!isErrorsObject(input)) {
        return out;
    }

    for (const [key, value] of Object.entries(input)) {
        // A concatenação cobre a chave já pontilhada sozinha: `"a.b"` sob o prefixo
        // `"x"` vira `"x.a.b"`, que é o mesmo id que o campo aninhado monta.
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "string") {
            out[path] = value;
            continue;
        }

        if (Array.isArray(value)) {
            const first = value.find((item) => typeof item === "string");

            if (first !== undefined) {
                out[path] = first;
            }

            continue;
        }

        if (isErrorsObject(value)) {
            Object.assign(out, flattenErrors(value, path));
        }
    }

    return out;
}