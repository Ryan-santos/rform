import type { Condition, ConditionFn, ConditionOperator, ConditionRef } from "#rform/types";

/**
 * O que o avaliador precisa saber: o form inteiro e onde o campo mora nele. O
 * `path` é opcional porque só uma condição em forma de função lê o valor próprio.
 */
export type ConditionContext = {
    form: unknown;
    path?: string;
};

/** Caminho pontilhado a partir da raiz do form: `endereco.uf`, `itens.0.nome`. */
const getPath = (root: unknown, path: string): unknown => {
    let current = root;

    for (const segment of path.split(".")) {
        if (current === null || current === undefined || typeof current !== "object") {
            return undefined;
        }

        current = (current as Record<string, unknown>)[segment];
    }

    return current;
};

/** Coerção explícita: `String(undefined)` daria `"undefined"` e casaria por engano. */
const str = (value: unknown): string =>
    value === undefined || value === null ? "" : `${value as string}`;

const isBlank = (value: unknown): boolean => {
    if (value === undefined || value === null || value === "") {
        return true;
    }

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    // `false` e `0` não são vazios: o campo respondeu.
    if (typeof value === "object") {
        return Object.keys(value as object).length === 0;
    }

    return false;
};

const includes = (haystack: unknown, needle: unknown): boolean => {
    if (Array.isArray(haystack)) {
        return haystack.includes(needle);
    }

    if (typeof haystack === "string") {
        return haystack.includes(str(needle));
    }

    return false;
};

const asList = (value: unknown, field: string, op: string): unknown[] => {
    if (!Array.isArray(value)) {
        throw new Error(
            `[rform] the "${op}" condition on "${field}" needs an array in "value", got ${typeof value}.`
        );
    }

    return value;
};

const toRegExp = (ref: ConditionRef, field: string, pattern: unknown): RegExp => {
    try {
        return new RegExp(str(pattern), (ref as { flags?: string }).flags);
    } catch (cause) {
        throw new Error(
            `[rform] invalid regular expression in the condition on "${field}": ${str(cause)}`
        );
    }
};

const compare = (ref: ConditionRef, left: unknown): boolean => {
    // Widened de uma vez: estreitar `op` caso a caso deixa o ramo de operador
    // desconhecido — o schema que veio de uma API — inalcançável para o checker.
    const { field, op } = ref as { field: string; op: ConditionOperator };
    const right = (ref as { value?: unknown }).value;

    switch (op) {
        case "is_empty":
            return isBlank(left);
        case "is_not_empty":
            return !isBlank(left);
        case "==":
            // oxlint-disable-next-line eqeqeq -- a diferença entre `==` e `===` é o contrato
            return left == right;
        case "===":
            return left === right;
        case "!=":
            // oxlint-disable-next-line eqeqeq -- idem
            return left != right;
        case "!==":
            return left !== right;
        case ">":
            return (left as number) > (right as number);
        case ">=":
            return (left as number) >= (right as number);
        case "<":
            return (left as number) < (right as number);
        case "<=":
            return (left as number) <= (right as number);
        case "in":
            return asList(right, field, op).includes(left);
        case "not_in":
            return !asList(right, field, op).includes(left);
        case "contains":
            return includes(left, right);
        case "not_contains":
            return !includes(left, right);
        case "starts_with":
            return str(left).startsWith(str(right));
        case "ends_with":
            return str(left).endsWith(str(right));
        case "matches":
            return toRegExp(ref, field, right).test(str(left));
    }

    throw new Error(`[rform] unknown condition operator "${str(op)}" on "${field}".`);
};

/**
 * Avalia a condição de `visibleWhen` / `disabledWhen`. Erro de autoria lança alto
 * (operador desconhecido, `op` ausente, `in` sem array, regex inválida); dado
 * ausente apenas não casa. Ver "Condicionais no schema" no `.claude/CLAUDE.md`.
 *
 * @example matchCondition({ field: "tipo", op: "in", value: ["json"] }, { form })
 */
export default function matchCondition(condition: Condition, context: ConditionContext): boolean {
    // Array é AND — a mesma forma que o `rule` já aceita.
    if (Array.isArray(condition)) {
        return condition.every((item) => matchCondition(item, context));
    }

    if (typeof condition === "function") {
        return !!(condition as ConditionFn)({
            value: context.path === undefined ? undefined : getPath(context.form, context.path),
            form: context.form
        });
    }

    if (!condition || typeof condition !== "object") {
        throw new Error(`[rform] cannot resolve condition: ${typeof condition}`);
    }

    if ("or" in condition) {
        return condition.or.some((item) => matchCondition(item, context));
    }

    if ("not" in condition) {
        return !matchCondition(condition.not, context);
    }

    // Widened aqui pelo mesmo motivo do `compare`: `op` é uma união de literais, e
    // estreitar por ela deixaria o ramo do schema malformado inalcançável.
    const { field, op } = condition as { field?: unknown; op?: unknown };

    if (typeof field !== "string") {
        throw new Error(`[rform] a condition needs a "field" path, got ${typeof field}.`);
    }

    if (!op) {
        throw new Error(
            `[rform] the condition on "${field}" has no "op". There is no default — write "===" or "==" explicitly.`
        );
    }

    return compare(condition as ConditionRef, getPath(context.form, field));
}