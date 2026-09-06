import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";

import {
    defineNuxtModule,
    addComponent,
    addComponentsDir,
    createResolver,
    hasNuxtModule,
    addTypeTemplate,
    addTemplate,
    addImports,
    addVitePlugin
} from "@nuxt/kit";

import { name, version } from "../package.json";
import { resolveAppMessages, trTemplate, type I18nConfig } from "./appMessages";
import { collectPresets } from "./presets";
import { collectComponents, type ComponentFile } from "./scan";
import vitePlugin from "./vite.plugin";

/**
 * Bound, not destructured: `@nuxt/kit` types `resolve` as a method, so pulling
 * it off the object trips `unbound-method`. It closes over the base url and
 * never touches `this`, but binding says so without a lint exception.
 */
const resolver = createResolver(import.meta.url);
const resolve = resolver.resolve.bind(resolver);

/**
 * A module specifier for a generated template. Backslashes would be escapes in
 * the emitted source, and a `.ts` suffix needs `allowImportingTsExtensions`,
 * which a consumer app has no reason to set. `.vue` is kept — it is required.
 */
const specifier = (path: string) =>
    JSON.stringify(
        path
            .split("\\")
            .join("/")
            .replace(/\.[tj]s$/, "")
    );

/**
 * True when `source` has an import declaration that pulls a *value* (not just
 * a type, erased at compile time) from `#rform/...`. Used to single out a
 * `src/runtime/utils/*.ts` helper that can re-enter `#rform/utils` mid-load —
 * see the comment on the `utils.ts` template below. A `type`-only import (the
 * common case: `import type { Base } from "#rform/types"`) is excluded on
 * purpose, because it is erased and never runs any code.
 */
const importsRformValue = (source: string) =>
    source.split("\n").some((line) => {
        const match = /^\s*import\s+([^;]*?)\s+from\s+["']#rform\//.exec(line);

        return !!match && !/^type\s/.test((match[1] ?? "").trim());
    });

/**
 * Forward-slashed: this path is both written into generated source, where a
 * backslash is an escape, and handed to `addComponent`, which — unlike
 * `addComponentsDir` — does not normalize it before it becomes an import.
 */
const filePath = ({ root, file }: ComponentFile) => join(root, file).split("\\").join("/");

export interface ModuleOptions {
    /**
     * Idioma usado quando o app **não** tem `@nuxtjs/i18n`. Com ele instalado,
     * quem manda é o locale dele — este valor não é lido.
     */
    locale: string;
}

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name,
        version,
        configKey: name,
        compatibility: {
            nuxt: ">=4.0.0"
        }
    },

    moduleDependencies: {
        "@nuxt/icon": {
            defaults: {
                size: "1em",
                aliases: {
                    minus: "fa6-solid:minus",
                    plus: "fa6-solid:plus",
                    remove: "fa6-solid:xmark",
                    select: "mi:select",
                    loading: "eos-icons:loading",
                    alert: "ooui:alert",
                    search: "mi:search",
                    check: "fa6-solid:check",
                    calendar: "fa6-regular:calendar",
                    "chevron-left": "fa6-solid:chevron-left",
                    "chevron-right": "fa6-solid:chevron-right"
                }
            }
        }
    },

    defaults: {
        locale: "pt-BR"
    },

    async setup(options, nuxt) {
        const componentsPath = resolve("runtime/components");

        /**
         * Qual dos dois motores do `tr` o app recebe. Escolhido aqui e não em
         * runtime: o corpo da ponte não escreve o import do `@intlify/core`,
         * então o app que tem @nuxtjs/i18n não paga os ~137 kB dele. A exclusão
         * é estrutural, não uma otimização de bundler que pode falhar.
         *
         * `hasNuxtModule` lê a lista declarada de módulos, então não depende de
         * o rform ser registrado antes ou depois do i18n no `modules:` — ao
         * contrário do hook, que só resolve tarde.
         *
         * Declarado no topo porque o template de `types/tr.d.ts` (bem acima da
         * região de aliases) também o lê.
         */
        const hasI18n = hasNuxtModule("@nuxtjs/i18n", nuxt);

        const roots = {
            /** Form and Dynamic — neither is a field, so neither is replaceable. */
            containers: componentsPath,
            fields: resolve("runtime/components/fields"),
            utils: resolve("runtime/components/utils"),
            userFields: join(nuxt.options.srcDir, name, "fields"),
            userUtils: join(nuxt.options.srcDir, name, "utils")
        };

        /** `null` when the directory is absent — the two user roots are optional. */
        const listing = Object.fromEntries(
            await Promise.all(
                Object.entries(roots).map(
                    async ([key, path]) => [key, await readdir(path).catch(() => null)] as const
                )
            )
        ) as Record<keyof typeof roots, string[] | null>;

        /**
         * Built-in root first, so a user component of the same name replaces it
         * — the same precedence the presets already use.
         */
        const scan = (...keys: Array<keyof typeof roots>) =>
            collectComponents(
                keys.map((key) => ({
                    root: roots[key],
                    files: listing[key] ?? [],
                    user: key.startsWith("user")
                }))
            );

        const containers = scan("containers");
        const fields = scan("fields", "userFields");
        const utils = scan("utils", "userUtils");

        /** Everything with a `Props` type: what `defineFieldDefaults` is keyed by. */
        const components = [...containers, ...fields];

        /**
         * Relative, not absolute — and only here, where a `.vue` file's `Props`
         * is read back as a type.
         *
         * `@vue/compiler-sfc` resolves a relative type import with plain `fs`,
         * but sends anything else through TypeScript's module resolution, which
         * does not resolve a bare `.vue` specifier on its own. Staying relative
         * keeps this hop off that path entirely.
         */
        const relativeSpecifier = (template: string, target: string) => {
            const from = dirname(join(nuxt.options.buildDir, template));
            const path = relative(from, target).split("\\").join("/");

            return JSON.stringify(path.startsWith(".") ? path : `./${path}`);
        };

        const importer = (template: string) => (component: ComponentFile) =>
            `import(${relativeSpecifier(template, filePath(component))}).Props`;

        const componentsTypes = `${name}/types/components/index.ts`;

        addTemplate({
            filename: componentsTypes,
            write: true,
            getContents: () =>
                [
                    components
                        .map(
                            (component) =>
                                `export type ${component.name} = ${importer(componentsTypes)(component)}`
                        )
                        .join("\n   "),
                    "export type Utils = import('./utils').default",
                    "",
                    "export default interface All {",
                    `   ${components.map(({ name }) => `${name}: ${name}`).join("\n       ")}`,
                    "   Utils: Utils",
                    "}"
                ].join("\n")
        });

        const utilsTypes = `${name}/types/components/utils/index.ts`;

        addTemplate({
            filename: utilsTypes,
            write: true,
            getContents: () =>
                [
                    utils
                        .map(
                            (component) =>
                                `export type ${component.name} = ${importer(utilsTypes)(component)}`
                        )
                        .join("\n"),
                    "",
                    "export default interface All {",
                    `   ${utils.map(({ name }) => `${name}: ${name}`).join("\n    ")}`,
                    "}"
                ].join("\n")
        });

        addTemplate({
            filename: `${name}/types/components/utils/props.ts`,
            write: true,
            getContents: () =>
                [
                    "type Utils = import('./').default",
                    "",
                    utils
                        .map(
                            ({ name }) =>
                                `export type ${name} = Omit<Utils["${name}"], "ui"> & { ui?: { Utils?: { ${name}?: Utils["${name}"]["ui"] } } }`
                        )
                        .join("\n   "),
                    "",
                    "export default interface All {",
                    `   ${utils.map(({ name }) => `${name}: ${name}`).join("\n    ")}`,
                    "}"
                ].join("\n")
        });

        addTemplate({
            filename: `${name}/types/index.d.ts`,
            write: true,
            getContents: () => `export * from "${resolve("type")}"`
        });

        /**
         * Name -> module, resolved across both roots. `useField` reads a
         * component's own `defaults` through this: a relative dynamic import
         * inside the composable compiles to a glob rooted at the module, which
         * a component under `app/rform` would never be part of.
         *
         * The entries are thunks, so `Text.vue -> useField -> registry ->
         * Text.vue` never closes at load time.
         */
        addTemplate({
            filename: `${name}/registry.ts`,
            write: true,
            getContents: () => {
                const record = (list: ComponentFile[]) =>
                    list
                        .map(
                            (component) =>
                                `    ${component.name}: () => import(${specifier(filePath(component))})`
                        )
                        .join(",\n");

                /**
                 * The hook class every field and util carries. The composables
                 * prepend it to the top-most `ui` entry, and `style.css` selects
                 * on it. Generated here rather than derived in the composable
                 * because this is the last place the three lists are still told
                 * apart: containers get none — `Form` writes its own `RForm` and
                 * `Dynamic` renders no element of its own — and the prefixes are
                 * the same ones `addComponentsDir` registers below, so the class
                 * mirrors the tag the app writes (`<RText>` → `.RText`).
                 */
                const hooks = (list: ComponentFile[], generic: string, prefix: string) =>
                    list
                        .map(
                            ({ name }) =>
                                `        ${name}: ${JSON.stringify(`${generic} ${prefix}${name}`)}`
                        )
                        .join(",\n");

                return [
                    "// auto-generated — component name → module, for runtime defaults lookup",
                    "export const components = {",
                    record(components),
                    "};",
                    "",
                    "export const utils = {",
                    record(utils),
                    "};",
                    "",
                    "// the class each one carries, for the resets in style.css",
                    "export const hooks = {",
                    "    fields: {",
                    hooks(fields, "RField", "R"),
                    "    },",
                    "    utils: {",
                    hooks(utils, "RUtil", "RUtils"),
                    "    }",
                    "};",
                    "",
                    "export default { components, utils, hooks };"
                ].join("\n");
            }
        });

        const containerChildren: Record<string, string> = {
            Object: "Schema",
            Array: "FieldConfig | SlotField"
        };

        addTemplate({
            filename: `${name}/components-map.ts`,
            write: true,
            getContents: () =>
                [
                    "// auto-generated — type → component module",
                    ...fields.map(
                        (component) =>
                            `import ${component.name} from ${specifier(filePath(component))};`
                    ),
                    "",
                    "export default {",
                    ...fields.map(
                        ({ name }) => `    ${JSON.stringify(name.toLowerCase())}: ${name},`
                    ),
                    "} as const;"
                ].join("\n")
        });

        /**
         * Standalone on purpose: `available` in a rule preset is typed against
         * this, and the presets are themselves read back by `types/presets.d.ts`.
         * Deriving it from the component Props would close that loop — which is
         * also why this is a literal union built from file names, and stays that
         * way now that user components feed it.
         */
        addTypeTemplate({
            filename: `${name}/types/fields.d.ts`,
            write: true,
            getContents: () =>
                [
                    "// auto-generated — the field type each component maps to",
                    "export type FieldType =",
                    ...fields.map(
                        ({ name }, index) =>
                            `    | ${JSON.stringify(name.toLowerCase())}${
                                index === fields.length - 1 ? ";" : ""
                            }`
                    )
                ].join("\n")
        });

        addTypeTemplate({
            filename: `${name}/types/schema.d.ts`,
            write: true,
            getContents: () => {
                const fieldNames = fields.map((field) => field.name);
                return [
                    `import type Components from "./components";`,
                    `import type { Rule } from "./presets";`,
                    `import type { FieldType } from "./fields";`,
                    `import type { ZodType, infer as zInfer } from "zod";`,
                    ``,
                    `type Base<P, C> = Omit<P, "modelValue" | "onUpdate:modelValue" | "ui" | "name" | "error" | "loading" | "default" | "rule"> & {`,
                    `    rule?: Rule<C>;`,
                    `    default?: unknown;`,
                    `    label?: string;`,
                    `};`,
                    ``,
                    `export type SlotField = { slot: string; rule?: Rule };`,
                    ``,
                    `export type Schema = Record<string, FieldConfig | SlotField>;`,
                    ``,
                    ...fieldNames.map((n) => {
                        const t = n.toLowerCase();
                        const extra = containerChildren[n]
                            ? `; children: ${containerChildren[n]}`
                            : "";
                        return `export type Field${n} = Base<Components["${n}"], "${t}"> & { type: "${t}"${extra} };`;
                    }),
                    ``,
                    `export type FieldConfig =`,
                    ...fieldNames.map(
                        (n, i) => `    | Field${n}${i === fieldNames.length - 1 ? ";" : ""}`
                    ),
                    ``,
                    `export type InferData<S extends Schema> = {`,
                    `    [K in keyof S]:`,
                    `        S[K] extends { rule: infer R extends ZodType } ? zInfer<R> :`,
                    `        S[K] extends { type: "object"; children: infer C extends Schema } ? InferData<C> :`,
                    `        S[K] extends { type: "array"; children: infer C } ?`,
                    `            (C extends FieldConfig ? Array<InferDataItem<C>> : unknown[]) :`,
                    `        unknown;`,
                    `};`,
                    `type InferDataItem<C> =`,
                    `    C extends { type: "object"; children: infer S extends Schema } ? InferData<S> :`,
                    `    C extends { rule: infer R extends ZodType } ? zInfer<R> : unknown;`,
                    ``,
                    `export type { FieldType };`
                ].join("\n");
            }
        });

        const presetRoots = [
            resolve("runtime/presets"),
            join(nuxt.options.srcDir, name, "presets")
        ];

        /**
         * `app/rform/defaults.ts` — what the user overrides on top of each
         * component's own `defaults`. The template exists either way, so the
         * composables can import it unconditionally.
         */
        const userDefaultsFile = async () => {
            const dir = join(nuxt.options.srcDir, name);
            const files = await readdir(dir).catch(() => [] as string[]);
            const file = files.find((entry) => /^defaults\.[tj]s$/.test(entry));

            return file ? join(dir, file) : null;
        };

        addTemplate({
            filename: `${name}/defaults.ts`,
            write: true,
            getContents: async () => {
                const file = await userDefaultsFile();

                return [
                    "// auto-generated — user overrides for each component's defaults",
                    `import type Components from "#${name}/types/components";`,
                    `import type { DeepPartial } from ${specifier(resolve("type"))};`,
                    "",
                    file ? `import defaults from ${specifier(file)};` : "const defaults = {};",
                    "",
                    "export default defaults as DeepPartial<Components>;"
                ].join("\n");
            }
        });

        const scanPresets = async (root: string, kind: "rules" | "masks") => {
            const dir = join(root, kind);
            const files = await readdir(dir, { recursive: true }).catch(() => [] as string[]);

            try {
                return collectPresets(files).map((preset) => ({
                    name: preset.name,
                    path: join(dir, preset.file)
                }));
            } catch (error) {
                // Nuxt reports a template failure without its cause, so the
                // collision details would otherwise never reach the terminal.
                console.error((error as Error).message, `\n  in ${dir}`);
                throw error;
            }
        };

        /**
         * Built-ins first, so a user preset with the same name wins.
         */
        const presetsOf = async (kind: "rules" | "masks") => {
            const merged = new Map<string, string>();

            for (const root of presetRoots) {
                for (const preset of await scanPresets(root, kind)) {
                    merged.set(preset.name, preset.path);
                }
            }

            return [...merged];
        };

        addTemplate({
            filename: `${name}/presets.ts`,
            write: true,
            getContents: async () => {
                const kinds = {
                    rules: await presetsOf("rules"),
                    masks: await presetsOf("masks")
                };

                const lines = (kind: "rules" | "masks") => {
                    const prefix = kind === "rules" ? "_rule" : "_mask";

                    return {
                        imports: kinds[kind].map(
                            ([, path], index) => `import ${prefix}${index} from ${specifier(path)};`
                        ),
                        record: kinds[kind]
                            .map(
                                ([preset], index) =>
                                    `    ${JSON.stringify(preset)}: ${prefix}${index}`
                            )
                            .join(",\n")
                    };
                };

                const rules = lines("rules");
                const masks = lines("masks");

                return [
                    "// auto-generated — preset modules discovered on disk",
                    ...rules.imports,
                    ...masks.imports,
                    "",
                    "export const rules = {",
                    rules.record,
                    "};",
                    "",
                    "export const masks = {",
                    masks.record,
                    "};",
                    "",
                    "export default { rules, masks };"
                ].join("\n");
            }
        });

        addTypeTemplate({
            filename: `${name}/types/presets.d.ts`,
            write: true,
            getContents: async () => {
                const entries = (list: Array<[string, string]>) =>
                    list.map(
                        ([preset, path]) =>
                            `    ${JSON.stringify(preset)}: typeof import(${specifier(path)}).default;`
                    );

                return [
                    `import type { ZodType } from "zod";`,
                    `import type { MaskInputOptions } from "maska";`,
                    ``,
                    `type Rules = {`,
                    ...entries(await presetsOf("rules")),
                    `};`,
                    ``,
                    `type Masks = {`,
                    ...entries(await presetsOf("masks")),
                    `};`,
                    ``,
                    `export type RuleName = keyof Rules;`,
                    `export type MaskName = keyof Masks;`,
                    ``,
                    `export type Mask = MaskName | (string & {}) | MaskInputOptions;`,
                    ``,
                    `type BaseContext = { value: any; form: any; t: (key: string, params?: Record<string, unknown>) => string };`,
                    ``,
                    `export type RuleFn = (context: BaseContext) => string | void | Promise<string | void>;`,
                    ``,
                    `/** Presets without \`available\` serve every field. */`,
                    `type NamesFor<C> = {`,
                    `    [K in keyof Rules]: Rules[K] extends { available: readonly (infer A)[] }`,
                    `        ? (C extends A ? K : never)`,
                    `        : K;`,
                    `}[keyof Rules];`,
                    ``,
                    `/** What a preset's validation takes on top of \`value\` and \`form\`. */`,
                    `type Args<K extends keyof Rules> = Rules[K]["validation"] extends (context: infer P) => any`,
                    `    ? Omit<P, keyof BaseContext>`,
                    `    : {};`,
                    ``,
                    `/** A preset taking arguments can only be referenced as \`{ name, ...args }\`. */`,
                    `export type RuleRef<C = any> = {`,
                    `    [K in NamesFor<C>]: {} extends Args<K>`,
                    `        ? (K | ({ name: K } & Args<K>))`,
                    `        : ({ name: K } & Args<K>);`,
                    `}[NamesFor<C>];`,
                    ``,
                    `type Single<C> = RuleRef<C> | RuleFn | ZodType;`,
                    ``,
                    `export type Rule<C = any> = Single<C> | Array<Single<C>>;`
                ].join("\n");
            }
        });

        /**
         * Message packs. `src/runtime/locales/<code>.ts` são os embutidos;
         * `app/rform/locales/<code>.ts` são os do usuário. Mesmo code não
         * substitui — **mescla**, com o do usuário por cima, então um pack que
         * traduz três chaves continua completo.
         *
         * O nome do arquivo é o code (`pt-BR.ts` -> `pt-BR`), e a lista é
         * varrida a cada `getContents`, para editar um pack regenerar o template.
         */
        const localeRoots = [
            resolve("runtime/locales"),
            join(nuxt.options.srcDir, name, "locales")
        ];

        const referenceLocale = resolve("runtime/locales/pt-BR");

        const localeFiles = async (): Promise<Array<[string, string[]]>> => {
            const merged = new Map<string, string[]>();

            for (const root of localeRoots) {
                const files = await readdir(root).catch(() => [] as string[]);

                for (const file of files) {
                    if (!/\.[tj]s$/.test(file) || /\.d\.[tj]s$/.test(file)) {
                        continue;
                    }

                    const code = file.replace(/\.[tj]s$/, "");

                    merged.set(code, [...(merged.get(code) ?? []), join(root, file)]);
                }
            }

            return [...merged];
        };

        addTemplate({
            filename: `${name}/locales.ts`,
            write: true,
            getContents: async () => {
                const entries = await localeFiles();
                const imports: string[] = [];

                const record = entries.map(([code, files], index) => {
                    const aliases = files.map((file, position) => {
                        const alias = `_locale${index}_${position}`;
                        imports.push(`import ${alias} from ${specifier(file)};`);

                        return alias;
                    });

                    const value = aliases.length > 1 ? `merger(${aliases.join(", ")})` : aliases[0];

                    return `    ${JSON.stringify(code)}: ${value}`;
                });

                const needsMerger = entries.some(([, files]) => files.length > 1);

                return [
                    "// auto-generated — message packs discovered on disk",
                    ...(needsMerger
                        ? [`import merger from ${specifier(resolve("runtime/utils/merger"))};`]
                        : []),
                    ...imports,
                    "",
                    `export const defaultLocale = ${JSON.stringify(options.locale)};`,
                    "",
                    "export const locales = {",
                    record.join(",\n"),
                    "};",
                    "",
                    "export const available = Object.keys(locales);",
                    "",
                    "export default { locales, defaultLocale, available };"
                ].join("\n");
            }
        });

        addTypeTemplate({
            filename: `${name}/types/locales.d.ts`,
            write: true,
            getContents: async () => {
                const entries = await localeFiles();

                return [
                    "// auto-generated — the shape of a message pack",
                    "",
                    `export type Messages = typeof import(${specifier(referenceLocale)}).default;`,
                    ``,
                    `/** Every dotted path that ends in a string: \`"rules.min.length"\`. */`,
                    `type Leaves<T> = {`,
                    `    [K in keyof T & string]: T[K] extends string ? K : \`\${K}.\${Leaves<T[K]>}\`;`,
                    `}[keyof T & string];`,
                    ``,
                    `export type MessageKey = Leaves<Messages>;`,
                    ``,
                    `export type LocaleCode =`,
                    ...entries.map(
                        ([code], index) =>
                            `    | ${JSON.stringify(code)}${index === entries.length - 1 ? ";" : ""}`
                    )
                ].join("\n");
            }
        });

        /**
         * O mapa de chaves do app.
         *
         * A config é lida dentro do `getContents`, e não no `setup`: o
         * @nuxtjs/i18n resolve `langDir` durante o setup **dele**, e
         * `getContents` só roda no `builder:generateApp` — mesmo truque que o
         * `localeFiles()` acima já usa.
         *
         * É uma leitura diferente da do `declaredLocales()`: aquela precisa só
         * dos *codes*, e por isso também olha as opções inline do `modules:`;
         * esta precisa de `langDir` + `file` já **resolvidos**, e por isso lê o
         * `nuxt.options.i18n` mesclado, tarde.
         *
         * A decisão de modo mora no `appMessages.ts` com o disco injetado —
         * aqui não há costura para testar as degradações.
         */
        addTypeTemplate({
            filename: `${name}/types/tr.d.ts`,
            write: true,
            getContents: async () =>
                trTemplate(
                    await resolveAppMessages({
                        hasI18n,
                        config: (nuxt.options as { i18n?: I18nConfig }).i18n,
                        rootDir: nuxt.options.rootDir,
                        read: (path) => readFile(path, "utf8"),
                        warn: (message) => console.warn(message)
                    })
                )
        });

        /**
         * A ponte com @nuxtjs/i18n.
         *
         * Um arquivo por locale no `buildDir`, reexportando o pack já mesclado
         * sob a chave `rform` — `.ts`, não `.json`, porque os packs são módulos
         * (o do usuário pode importar `defineLocale`) e quem os avalia é o Vite,
         * não o Node que roda este módulo.
         *
         * `i18n:registerModule` é a API documentada para isso. O hook
         * simplesmente nunca dispara se o @nuxtjs/i18n não estiver instalado —
         * daí não haver guarda a escrever nem dependência a declarar.
         */
        const localeEntries = await localeFiles();

        /**
         * Os codes que o **app** declarou.
         *
         * Registrar um code que ele não declarou não é neutro: o
         * `mergeConfigLocales` do i18n junta todos os configs num Map por code,
         * então um code que só a ponte cita **entra** na lista de locales do
         * app — e sai de lá no seletor de idioma, no `localeCodes` e no
         * prerender. Um app de `pt` e `es` não pode ganhar um `en` de brinde
         * só porque o módulo tem um pack `en`.
         */
        const declaredLocales = (): string[] => {
            const inline = (nuxt.options.modules ?? []).find(
                (entry) => Array.isArray(entry) && entry[0] === "@nuxtjs/i18n"
            ) as [string, { locales?: unknown }] | undefined;

            const config = (nuxt.options as { i18n?: { locales?: unknown } }).i18n;

            const codes = [config?.locales, inline?.[1]?.locales]
                .flatMap((list) => (Array.isArray(list) ? list : []))
                .map((locale) =>
                    typeof locale === "string" ? locale : (locale as { code?: string })?.code
                )
                .filter((code): code is string => !!code);

            return [...new Set(codes)];
        };

        /**
         * Gêmeo em build time do `matchLocale` (`runtime/utils/i18n.ts`): code
         * exato, senão o pack da mesma língua — é o que faz um app de `pt` ou
         * de `en-GB` receber mensagem, sem que nenhum code novo apareça.
         *
         * Não é um import porque `runtime/utils/i18n.ts` só resolve pelo alias
         * `#rform/types/locales`, que não existe em build time — trazer o
         * arquivo para cá arrastaria o grafo de tipos gerado junto.
         */
        const packFor = (code: string): string | undefined => {
            const wanted = code.toLowerCase();
            const primary = wanted.split("-")[0] ?? wanted;
            const codes = localeEntries.map(([entry]) => entry);

            return (
                codes.find((entry) => entry.toLowerCase() === wanted) ??
                codes.find((entry) => entry.toLowerCase().split("-")[0] === primary)
            );
        };

        const langDir = join(nuxt.options.buildDir, name, "i18n");

        const langFile = (code: string) =>
            [
                "// auto-generated — o pack deste locale, no namespace `rform`",
                `import { locales } from "#${name}/locales";`,
                "",
                `export default { ${name}: locales[${JSON.stringify(code)}] ?? {} };`
            ].join("\n");

        for (const [code] of localeEntries) {
            addTemplate({
                filename: `${name}/i18n/${code}.ts`,
                write: true,
                getContents: () => langFile(code)
            });
        }

        /**
         * E também **agora**, na mão: o @nuxtjs/i18n lê cada arquivo do
         * `langDir` com `readFileSync` durante o setup dele, para descobrir se
         * é objeto ou loader. Template do Nuxt só chega ao disco no
         * `builder:generateApp`, bem depois — o sintoma é um `ENOENT` apontando
         * para um caminho dentro do próprio `buildDir`.
         *
         * O `addTemplate` acima continua existindo para o arquivo sobreviver a
         * uma regeneração; o conteúdo é o mesmo, então escrever duas vezes não
         * diverge.
         */
        await mkdir(langDir, { recursive: true });

        await Promise.all(
            localeEntries.map(([code]) => writeFile(join(langDir, `${code}.ts`), langFile(code)))
        );

        /**
         * Cast: `i18n:registerModule` não está no `NuxtHooks`, e augmentar a
         * interface exigiria depender dos tipos do @nuxtjs/i18n — que é
         * justamente o que a ponte evita.
         */
        type RegisterI18n = (
            register: (config: {
                langDir: string;
                locales: Array<{ code: string; file: string }>;
            }) => void
        ) => void;

        const hookI18n = nuxt.hook as unknown as (
            event: "i18n:registerModule",
            callback: RegisterI18n
        ) => void;

        hookI18n("i18n:registerModule", (register) => {
            const declared = declaredLocales();

            /**
             * Um code declarado que nenhum pack atende — `es` — fica de fora, e
             * o vue-i18n resolve pelo `fallbackLocale` do app, que é a
             * precedência normal dele.
             *
             * Sem nenhum code legível (a config do i18n num layer, por exemplo)
             * cada pack entra sob o próprio code: é o mínimo que faz a ponte
             * funcionar, e são os codes do módulo, não apelidos inventados.
             */
            const locales =
                declared.length === 0
                    ? localeEntries.map(([code]) => ({ code, file: `${code}.ts` }))
                    : declared.flatMap((code) => {
                          const pack = packFor(code);

                          return pack ? [{ code, file: `${pack}.ts` }] : [];
                      });

            register({ langDir, locales });
        });

        nuxt.hook("builder:watch", (event, path) => {
            /**
             * O arquivo de mensagens do app mora fora do `srcDir`
             * (`<rootDir>/i18n` por padrão do @nuxtjs/i18n), e uma edição — não
             * só um add/unlink — muda as chaves que o `types/tr.d.ts` oferece.
             */
            if (/(^|[\\/])i18n[\\/].*\.json$/.test(path)) {
                return nuxt.callHook("builder:generateApp");
            }

            if (event !== "add" && event !== "unlink") {
                return;
            }

            const absolute = join(nuxt.options.srcDir, path);

            const watched = [
                ...presetRoots,
                roots.userFields,
                roots.userUtils,
                join(nuxt.options.srcDir, name, "locales"),
                // `defaults` with no extension, so `defaults.ts` and `defaults.js` both hit.
                join(nuxt.options.srcDir, name, "defaults")
            ];

            if (watched.some((root) => absolute.startsWith(root))) {
                return nuxt.callHook("builder:generateApp");
            }
        });

        const composablesPath = resolve("runtime/composables");

        const composables = (await readdir(composablesPath)).map((file) => ({
            name: basename(file, ".ts"),
            path: resolve(composablesPath, file)
        }));

        addTemplate({
            filename: `${name}/composables.ts`,
            write: true,
            getContents: () =>
                [
                    composables.map(({ name, path }) => `import ${name} from "${path}"`).join("\n"),
                    "",
                    "export {",
                    `   ${composables.map(({ name }) => name).join(",\n   ")}`,
                    "}",
                    "",
                    "export default {",
                    `   ${composables.map(({ name }) => name).join(",\n   ")}`,
                    "}"
                ].join("\n")
        });

        const utilsPath = resolve("runtime/utils");

        const helpers = await Promise.all(
            (await readdir(utilsPath)).map(async (file) => {
                const path = resolve(utilsPath, file);

                return {
                    name: basename(file, ".ts"),
                    path,
                    // See the comment on the template below — this is the
                    // invariant the interleaving relies on, not alphabetical
                    // luck.
                    reentrant: importsRformValue(await readFile(path, "utf8"))
                };
            })
        );

        addTemplate({
            filename: `${name}/utils.ts`,
            write: true,
            getContents: () => {
                /**
                 * A helper that value-imports `#rform/*` — today, only
                 * `tr.ts`, via `#rform/translate` — can re-enter this very
                 * barrel mid-evaluation: `#rform/utils` -> `tr.ts` ->
                 * `#rform/translate` -> `standalone.ts` -> `#rform/locales`
                 * -> a user locale pack -> `import { defineLocale } from
                 * "#rform/utils"`. Vite's SSR module runner lowers `export *
                 * from` to a positional `__vite_ssr_exportAll__` call rather
                 * than a live binding, so on that reentrant call only the
                 * `export *` statements that have already RUN are visible —
                 * not merely the ones declared later in the file. A `type`
                 * import doesn't count (it is erased, never runs any code),
                 * which is why `importsRformValue` excludes it — otherwise
                 * every helper here would qualify, since most reach
                 * `#rform/types` for a type.
                 *
                 * Stable-sorting the reentrant helpers to the end — instead
                 * of relying on `readdir`'s order putting `i18n.ts` (which
                 * owns `defineLocale`) before `tr.ts` — is what actually
                 * guarantees every non-reentrant helper's `export *` has run
                 * by the time a reentrant one loops back, regardless of what
                 * gets added to this directory later or what it gets renamed
                 * to.
                 */
                const ordered = [...helpers].sort(
                    (a, b) => Number(a.reentrant) - Number(b.reentrant)
                );

                return [
                    // Named exports too, so `#rform/utils` is the single
                    // public entry — `defineRule` and friends are imported,
                    // not global. Below, the `import` line keeps the `.ts`
                    // suffix (it is an absolute filesystem path, not a bare
                    // specifier); only the `export *` line goes through
                    // `specifier()` to drop it — a `.ts` module specifier
                    // needs `allowImportingTsExtensions`, which a consumer
                    // app has no reason to set, and the barrel is the only
                    // place that specifier reaches the consumer.
                    //
                    // Each `import` is paired with its own `export *` right
                    // below it, rather than one block of imports followed by
                    // one block of `export *` — see `ordered`, above, for why
                    // the pairs are reordered rather than left alphabetical.
                    ordered
                        .map(
                            ({ name, path }) =>
                                `import ${name} from "${path}"\nexport * from ${specifier(path)}`
                        )
                        .join("\n"),
                    "",
                    "export {",
                    `   ${helpers.map(({ name }) => name).join(",\n   ")}`,
                    "}",
                    "",
                    "export default {",
                    `   ${helpers.map(({ name }) => name).join(",\n   ")}`,
                    "}"
                ].join("\n");
            }
        });

        /**
         * A única linha que um app precisa escrever no CSS dele:
         *
         *     @import "tailwindcss";
         *     @import "#rform/tailwindcss";
         *
         * Traz as duas coisas: o `@source` dos componentes (o Tailwind não varre
         * `node_modules`, então sem ele nenhuma classe do módulo é emitida) e os
         * tokens `--rf-*`.
         *
         * A ordem das duas linhas só decide quem ganha quando **as duas** declaram a
         * mesma variável, porque ordem de layer é ordem de primeira aparição. Medido
         * no browser, sobrescrevendo `--rf-color-primary`: `@theme { --color-primary }`
         * (encadeia, o módulo nunca declara essa), `@layer rform { :root }` (mesma
         * layer, o app vem depois) e `:root` fora de layer (ganha de toda layer)
         * funcionam nas **duas** ordens. Só declarar `--rf-*` fora da `@layer rform`
         * — num `@theme` ou num `@layer base` — depende de `#rform` vir antes, e aí
         * falha calado. Antes faz as cinco formas funcionarem; é a recomendação.
         *
         * Tem de ser `@import` do entry do app, não `nuxt.options.css`: num arquivo
         * que o Tailwind não trata como parte de um entry, `@source` é ignorado e a
         * at-rule vaza crua para o browser.
         *
         * Template em vez de um `.css` do `dist`, porque o caminho sai absoluto e
         * resolvido: funciona igual com o pacote instalado, com link de workspace ou
         * com o módulo apontado por caminho relativo (o caso do playground, que não
         * tem `node_modules/rform`).
         */
        addTemplate({
            filename: `${name}/tailwind.css`,
            write: true,
            // `specifier` já devolve entre aspas, e com `/` — em CSS a barra
            // invertida do Windows seria escape.
            getContents: () =>
                [
                    "/* Sobrescreva `--rf-*` em `@layer rform` (ou o tema do app), nunca em `@theme`. */",
                    `@source ${specifier(roots.containers)};`,
                    `@import ${specifier(resolve("runtime/style.css"))};`
                ].join("\n")
        });

        nuxt.options.alias ||= {};

        /**
         * Registered before `#rform`: Vite matches aliases in insertion order,
         * so the shorter prefix would otherwise swallow this one into the build
         * directory. It is what lets a replacement wrap the original —
         * `import Base from "#rform/builtin/fields/Text.vue"`.
         */
        nuxt.options.alias[`#${name}/builtin`] = componentsPath;
        nuxt.options.alias[`#${name}/builtin/*`] = `${componentsPath}/*`;

        const alias = `${nuxt.options.buildDir}/${name}`;

        /**
         * Espelha o `@import "tailwindcss"` do app: sem extensão, o resolver de CSS do
         * Vite não acha o arquivo, então o apelido é explícito. Antes de `#rform/*`,
         * que senão engole o caminho e devolve um arquivo que não existe.
         */
        nuxt.options.alias[`#${name}/tailwindcss`] = `${alias}/tailwind.css`;

        /**
         * Alias **exato**, e antes de `#rform/*`: o Vite casa aliases na ordem
         * de inserção, e o prefixo mais curto engoliria este.
         */
        nuxt.options.alias[`#${name}/translate`] = resolve(
            hasI18n ? "runtime/translate/bridge" : "runtime/translate/standalone"
        );

        nuxt.options.alias[`#${name}`] = alias;
        nuxt.options.alias[`#${name}/*`] = `${alias}/*`;

        /**
         * One by one, not as a directory. Nuxt's scanner skips any file under a
         * path it has already scanned, so registering `components/` would claim
         * `components/fields` and `components/utils` and leave both empty.
         */
        for (const component of containers) {
            addComponent({
                name: `R${component.name}`,
                filePath: filePath(component),
                preload: true,
                prefetch: true
            });
        }

        addComponentsDir({
            prefix: "R",
            pathPrefix: false,
            preload: true,
            prefetch: true,
            path: roots.fields
        });

        addComponentsDir({
            prefix: "RUtils",
            pathPrefix: false,
            preload: true,
            prefetch: true,
            path: roots.utils
        });

        /**
         * Higher priority than the built-ins, so a same-named user component
         * wins every `<RText>` / `<RUtilsLabel>` in the app — including the ones
         * inside the module's own templates.
         */
        for (const [key, prefix] of [
            ["userFields", "R"],
            ["userUtils", "RUtils"]
        ] as const) {
            // Both are optional, and registering an absent directory only earns
            // a Nuxt warning.
            if (!listing[key]) {
                continue;
            }

            addComponentsDir({
                prefix,
                pathPrefix: false,
                preload: true,
                prefetch: true,
                priority: 10,
                path: roots[key]
            });
        }

        addImports({
            name: "default",
            as: "useRForm",
            from: resolve("runtime/composables/useRForm")
        });

        addVitePlugin(vitePlugin([roots.containers, roots.userFields, roots.userUtils]));
    }
});