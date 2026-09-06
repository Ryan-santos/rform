/**
 * Build time only. Reads the app's own message file — the one `@nuxtjs/i18n`
 * declares for its `defaultLocale` — and turns it into the `TrInput` union that
 * makes a literal in a text prop a compile error.
 *
 * Pure: `module.ts` does the disk and the config, this does the shapes.
 */

import { join } from "node:path";

export type ParamInfo = { named: string[]; plural: boolean };

export type TrMode =
    /** No `@nuxtjs/i18n`, or a file that cannot be read. `TrInput` is `string`. */
    | { kind: "loose" }
    /** i18n, but no message file declared: no app key to offer, rigour kept. */
    | { kind: "moduleOnly" }
    | { kind: "strict"; messages: Record<string, string> };

/** `{ form: { nome: "Nome" } }` -> `{ "form.nome": "Nome" }`. */
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
 * The literal interpolation goes first: `{'{{contato_nome}}'}` is vue-i18n's
 * way of printing braces, and its inside is not a param.
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
    "// auto-generated — the keys `tr` accepts, read from the app's own locale file",
    "",
    `import type { MessageKey } from "./locales";`,
    "",
    "export type Interp = string | number;",
    "",
    '/** An explicit literal: `tr("~~Nome")`. */',
    "export type Literal = `~~${string}`;",
    "",
    "/** A message of the module's own pack, written out in full. */",
    "export type ModuleKey = `rform.${MessageKey}`;",
    ""
];

export const trTemplate = (mode: TrMode): string => {
    if (mode.kind === "loose") {
        return [
            ...HEADER,
            "/**",
            " * Either the app has no `@nuxtjs/i18n`, or its message file could not be",
            " * read. Being strict here would reject every valid key.",
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
            " * The app has i18n but declares no message key, so there is none to offer —",
            " * and the rigour stays: text is a key or a `~~` literal.",
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
 * Which of the three modes the app earns. Pure, with the disk injected: the
 * decision is what has to be covered, and `module.ts` has no seam for a test.
 *
 * The two degradations are different on purpose. **No file declared** is not a
 * failure — the app has i18n, there is simply no app key to offer, and the
 * rigour stays. **A file that cannot be read** is a failure, and being strict
 * there would reject every valid key, so it says so and falls back to `string`.
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

    /**
     * `restructureDir` defaults to `"i18n"` in @nuxtjs/i18n v10, and `langDir`
     * to `"locales"` — the same pair its own `resolve(layer.i18nDir, langDir)`
     * uses. `false` flattens the first half away.
     */
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