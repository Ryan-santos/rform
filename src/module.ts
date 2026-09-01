import { readdir } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";

import {
    defineNuxtModule,
    addComponent,
    addComponentsDir,
    createResolver,
    addTypeTemplate,
    addTemplate,
    addImports,
    addVitePlugin
} from "nuxt/kit";

import { name, version } from "../package.json";
import { collectPresets } from "./presets";
import { collectComponents, type ComponentFile } from "./scan";
import vitePlugin from "./vite.plugin";

const { resolve } = createResolver(import.meta.url);

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
 * Forward-slashed: this path is both written into generated source, where a
 * backslash is an escape, and handed to `addComponent`, which — unlike
 * `addComponentsDir` — does not normalize it before it becomes an import.
 */
const filePath = ({ root, file }: ComponentFile) => join(root, file).split("\\").join("/");

export default defineNuxtModule({
    meta: {
        name,
        version,
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

    async setup(_, nuxt) {
        const componentsPath = resolve("runtime/components");

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
         * Name -> module, resolved across both roots. `useInjection` reads a
         * component's own `defaults` through this: a relative dynamic import
         * inside the composable compiles to a glob rooted at the module, which
         * a component under `app/rform` would never be part of.
         *
         * The entries are thunks, so `Text.vue -> useInjection -> registry ->
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
                    "export default { components, utils };"
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
                    `type BaseContext = { value: any; form: any };`,
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

        nuxt.hook("builder:watch", (event, path) => {
            if (event !== "add" && event !== "unlink") {
                return;
            }

            const absolute = join(nuxt.options.srcDir, path);

            const watched = [
                ...presetRoots,
                roots.userFields,
                roots.userUtils,
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

        const helpers = (await readdir(utilsPath)).map((file) => ({
            name: basename(file, ".ts"),
            path: resolve(utilsPath, file)
        }));

        addTemplate({
            filename: `${name}/utils.ts`,
            write: true,
            getContents: () =>
                [
                    helpers.map(({ name, path }) => `import ${name} from "${path}"`).join("\n"),
                    "",
                    // Named exports too, so `#rform/utils` is the single public
                    // entry — `defineRule` and friends are imported, not global.
                    // Extensionless: a `.ts` specifier needs
                    // `allowImportingTsExtensions`, which a consumer app may not set.
                    helpers.map(({ path }) => `export * from ${specifier(path)}`).join("\n"),
                    "",
                    "export {",
                    `   ${helpers.map(({ name }) => name).join(",\n   ")}`,
                    "}",
                    "",
                    "export default {",
                    `   ${helpers.map(({ name }) => name).join(",\n   ")}`,
                    "}"
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