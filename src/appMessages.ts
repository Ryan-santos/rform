// Build time. Lê o arquivo de mensagens do app — o que o i18n declara para o
// `defaultLocale` — e o transforma na união `TrInput`. Puro: `module.ts` cuida do
// disco e da config, aqui ficam as formas.

import { join } from "node:path";

export type ParamInfo = { named: string[]; plural: boolean };

export type TrMode =
    /** Sem i18n, ou com arquivo ilegível. `TrInput` vira `string`. */
    | { kind: "loose" }
    /** Com i18n e sem arquivo declarado: não há chave do app a oferecer, e o rigor fica. */
    | { kind: "moduleOnly" }
    | { kind: "strict"; messages: Record<string, string> };

/**
 * Achata um objeto de mensagens em caminhos pontilhados.
 *
 * @example flattenMessages({ form: { nome: "Nome" } }) // → { "form.nome": "Nome" }
 */
export const flattenMessages = (source: unknown, prefix = ""): Record<string, string> => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
        return {};
    }

    const out: Record<string, string> = {};

    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
        const path = `${prefix}${key}`;

        if (typeof value === "string") {
            out[path] = value;
            continue;
        }

        Object.assign(out, flattenMessages(value, `${path}.`));
    }

    return out;
};

/**
 * Que params uma mensagem declara, e se ela é plural. A interpolação literal sai
 * primeiro: `{'{{contato_nome}}'}` é como o vue-i18n imprime chaves cruas, e o que
 * está lá dentro não é param — é o mesmo escape que o `{'@'}` de um e-mail usa.
 */
export const messageParams = (message: string): ParamInfo => {
    const stripped = message.replace(/\{\s*'[^']*'\s*\}/g, "");

    const named = [
        ...new Set([...stripped.matchAll(/\{\s*(\w+)\s*\}/g)].map((match) => match[1]!))
    ];

    return { named, plural: stripped.includes("|") };
};

const entry = (key: string, message: string): string => {
    const { named, plural } = messageParams(message);

    if (named.length === 0) {
        return `    ${JSON.stringify(key)}: ${plural ? "number" : "never"};`;
    }

    const object = `{ ${named.map((param) => `${param}: Interp`).join("; ")} }`;

    return `    ${JSON.stringify(key)}: ${plural ? `${object} | number` : object};`;
};

const HEADER = [
    "// gerado — as chaves que o `tr` aceita, lidas do arquivo de locale do app",
    "",
    `import type { MessageKey } from "./locales";`,
    "",
    "export type Interp = string | number;",
    "",
    '/** Um literal explícito: `tr("~~Nome")`. */',
    "export type Literal = `~~${string}`;",
    "",
    "/** Uma mensagem do pack do próprio módulo, escrita por extenso. */",
    "export type ModuleKey = `rform.${MessageKey}`;",
    ""
];

export const trTemplate = (mode: TrMode): string => {
    if (mode.kind === "loose") {
        return [
            ...HEADER,
            "/**",
            " * Ou o app não tem i18n, ou o arquivo de mensagens dele não pôde ser lido.",
            " * Ser rigoroso aqui rejeitaria toda chave válida.",
            " */",
            "export type TrInput = string;",
            ""
        ].join("\n");
    }

    const keys = mode.kind === "strict" ? Object.entries(mode.messages) : [];

    if (keys.length === 0) {
        return [
            ...HEADER,
            "/**",
            " * O app tem i18n mas não declara chave nenhuma, então não há o que oferecer",
            " * — e o rigor fica: texto é uma chave ou um literal `~~`.",
            " */",
            "export type TrInput = ModuleKey | Literal;",
            ""
        ].join("\n");
    }

    return [
        ...HEADER,
        "interface AppMessages {",
        ...keys.map(([key, message]) => entry(key, message)),
        "}",
        "",
        "type Paramless = {",
        "    [K in keyof AppMessages]: [AppMessages[K]] extends [never] ? K : never",
        "}[keyof AppMessages];",
        "",
        "type ParamKey = Exclude<keyof AppMessages, Paramless>;",
        "",
        "type WithParams = {",
        "    [K in ParamKey]: { key: K; params: AppMessages[K] }",
        "}[ParamKey];",
        "",
        "export type TrInput = Paramless | ModuleKey | WithParams | Literal;",
        ""
    ].join("\n");
};

export type I18nLocale = {
    code?: string;
    file?: string | { path?: string };
    files?: Array<string | { path?: string }>;
};

export type I18nConfig = {
    locales?: Array<string | I18nLocale>;
    defaultLocale?: string;
    langDir?: string;
    restructureDir?: string | false;
};

const filesOf = (locale: I18nLocale): string[] =>
    [...(locale.files ?? []), ...(locale.file === undefined ? [] : [locale.file])]
        .map((entry) => (typeof entry === "string" ? entry : entry?.path))
        .filter((entry): entry is string => !!entry);

/**
 * Qual dos três modos o app ganha. Puro, com o disco injetado — a decisão é o que
 * precisa de cobertura, e `module.ts` não tem costura para testar. As duas
 * degradações são diferentes de propósito; ver "O mapa de chaves do app" no
 * `.claude/CLAUDE.md`.
 */
export const resolveAppMessages = async (input: {
    hasI18n: boolean;
    config?: I18nConfig;
    rootDir: string;
    read: (path: string) => Promise<string>;
    warn?: (message: string) => void;
}): Promise<TrMode> => {
    if (!input.hasI18n) {
        return { kind: "loose" };
    }

    const config = input.config ?? {};

    const locales = (config.locales ?? []).map((locale) =>
        typeof locale === "string" ? { code: locale } : locale
    );

    const entry = locales.find((locale) => locale.code === config.defaultLocale) ?? locales[0];
    const files = entry ? filesOf(entry) : [];

    if (files.length === 0) {
        return { kind: "moduleOnly" };
    }

    // `restructureDir` default é `"i18n"` no i18n v10, e `langDir` é `"locales"` — o
    // mesmo par que o `resolve(layer.i18nDir, langDir)` dele usa. `false` achata a
    // primeira metade.
    const restructureDir =
        typeof config.restructureDir === "string"
            ? config.restructureDir
            : config.restructureDir === false
              ? ""
              : "i18n";

    const dir = join(input.rootDir, restructureDir, config.langDir ?? "locales");

    const degrade = (file: string, reason: string): TrMode => {
        input.warn?.(
            `[rform] não foi possível ler as chaves de tradução de "${join(dir, file)}" (${reason}). ` +
                "Sem elas o texto que o app passa em prop não é tipado — `TrInput` cai para `string`. " +
                "Só `.json` é lido; um `.ts`, um yaml ou um loader de `lazy: true` não são."
        );

        return { kind: "loose" };
    };

    const messages: Record<string, string> = {};

    for (const file of files) {
        if (!file.endsWith(".json")) {
            return degrade(file, "formato não suportado");
        }

        try {
            Object.assign(messages, flattenMessages(JSON.parse(await input.read(join(dir, file)))));
        } catch (error) {
            return degrade(file, error instanceof Error ? error.message : String(error));
        }
    }

    return { kind: "strict", messages };
};

export default { flattenMessages, messageParams, resolveAppMessages, trTemplate };