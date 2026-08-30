import vitePlugin from "./vite.plugin";

import {
    defineNuxtModule,
    addComponentsDir,
    createResolver,
    addTypeTemplate,
    addTemplate,
    addImports,
    addVitePlugin
} from "nuxt/kit";

import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";

import { collectPresets } from "./presets";

import {
    name,
    version
} from "../package.json";

const { resolve } = createResolver(import.meta.url);

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

    async setup (_, nuxt) {
        const componentsPath = resolve("runtime/components");

        const componentsProps = async (path: string = "") => (await readdir(resolve(componentsPath, path)))
            .map((file) => {
                if (!file.endsWith(".vue")) {
                    return null;
                }

                return {
                    name: basename(file, ".vue"),
                    importer: `import("${resolve(componentsPath, path, file)}").Props`
                };
            })
            .filter(v => v !== null);

        const components = await componentsProps();
        const componentsUtils = await componentsProps("Utils");

        addTemplate({
            filename: `${name}/types/components/index.ts`,
            write: true,
            getContents: () =>
                [
                    components.map(({ name, importer }) => `export type ${name} = ${importer}`).join("\n   "),
                    "export type Utils = import('./utils').default",
                    "",
                    "export default interface All {",
                    `   ${components.map(({ name }) => `${name}: ${name}`).join("\n       ")}`,
                    "   Utils: Utils",
                    "}"
                ].join("\n")
        });

        addTemplate({
            filename: `${name}/types/components/utils/index.ts`,
            write: true,
            getContents: () =>
                [
                    componentsUtils.map(({ name, importer }) => `export type ${name} = ${importer}`).join("\n"),
                    "",
                    "export default interface All {",
                    `   ${componentsUtils.map(({ name }) => `${name}: ${name}`).join("\n    ")}`,
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
                    componentsUtils.map(({ name }) => `export type ${name} = Omit<Utils["${name}"], "ui"> & { ui?: { Utils?: { ${name}?: Utils["${name}"]["ui"] } } }`).join("\n   "),
                    "",
                    "export default interface All {",
                    `   ${componentsUtils.map(({ name }) => `${name}: ${name}`).join("\n    ")}`,
                    "}"
                ].join("\n")
        });

        addTemplate({
            filename: `${name}/types/index.d.ts`,
            write: true,
            getContents: () => `export * from "${resolve("type")}"`
        });

        addTypeTemplate({
            filename: `${name}/types/app-config.d.ts`,
            write: true,
            getContents: () =>
                [
                    `import type Components from "#${name}/types/components"`,
                    `import type { DeepPartial } from "${resolve("type")}"`,
                    "",
                    "declare module 'nuxt/schema' {",
                    "   interface AppConfigInput {",
                    `       ${name}?: {`,
                    "           components?: DeepPartial<Components>",
                    "       }",
                    "   }",
                    "",
                    "   interface AppConfig {",
                    `       ${name}?: {`,
                    "           components?: DeepPartial<Components>",
                    "       }",
                    "   }",
                    "}",
                    "",
                    "export {}"
                ].join("\n")
        });

        const fieldComponents = components.filter(({ name }) =>
            !["Form", "Dynamic"].includes(name));

        const containerChildren: Record<string, string> = {
            Object: "Schema",
            Array: "FieldConfig | SlotField"
        };

        addTemplate({
            filename: `${name}/components-map.ts`,
            write: true,
            getContents: () => [
                "// auto-generated — type → component module",
                ...fieldComponents.map(({ name }) =>
                    `import ${name} from ${JSON.stringify(resolve(componentsPath, `${name}.vue`))};`),
                "",
                "export default {",
                ...fieldComponents.map(({ name }) =>
                    `    ${JSON.stringify(name.toLowerCase())}: ${name},`),
                "} as const;"
            ].join("\n")
        });

        /**
         * Standalone on purpose: `available` in a rule preset is typed against
         * this, and the presets are themselves read back by `types/presets.d.ts`.
         * Deriving it from the component Props would close that loop.
         */
        addTypeTemplate({
            filename: `${name}/types/fields.d.ts`,
            write: true,
            getContents: () => [
                "// auto-generated — the field type each component maps to",
                "export type FieldType =",
                ...fieldComponents.map(({ name }, index) =>
                    `    | ${JSON.stringify(name.toLowerCase())}${
                        index === fieldComponents.length - 1 ? ";" : ""
                    }`)
            ].join("\n")
        });

        addTypeTemplate({
            filename: `${name}/types/schema.d.ts`,
            write: true,
            getContents: () => {
                const fieldNames = fieldComponents.map(c => c.name);
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
                        const extra = containerChildren[n] ? `; children: ${containerChildren[n]}` : "";
                        return `export type Field${n} = Base<Components["${n}"], "${t}"> & { type: "${t}"${extra} };`;
                    }),
                    ``,
                    `export type FieldConfig =`,
                    ...fieldNames.map((n, i) =>
                        `    | Field${n}${i === fieldNames.length - 1 ? ";" : ""}`),
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

        const specifier = (path: string) =>
            JSON.stringify(path.split("\\").join("/").replace(/\.[tj]s$/, ""));

        const scanPresets = async (root: string, kind: "rules" | "masks") => {
            const dir = join(root, kind);
            const files = await readdir(dir, { recursive: true }).catch(() => [] as string[]);

            try {
                return collectPresets(files).map(preset => ({
                    name: preset.name,
                    path: join(dir, preset.file)
                }));
            }
            catch (error) {
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
                        imports: kinds[kind].map(([, path], index) =>
                            `import ${prefix}${index} from ${specifier(path)};`),
                        record: kinds[kind].map(([preset], index) =>
                            `    ${JSON.stringify(preset)}: ${prefix}${index}`).join(",\n")
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
                    list.map(([preset, path]) =>
                        `    ${JSON.stringify(preset)}: typeof import(${specifier(path)}).default;`);

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

            if (presetRoots.some(root => absolute.startsWith(root))) {
                return nuxt.callHook("builder:generateApp");
            }
        });

        const composablesPath = resolve("runtime/composables");

        const composables = (await readdir(composablesPath))
            .map(file => ({
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

        const utils = (await readdir(utilsPath))
            .map(file => ({
                name: basename(file, ".ts"),
                path: resolve(utilsPath, file)
            }));

        addTemplate({
            filename: `${name}/utils.ts`,
            write: true,
            getContents: () =>
                [
                    utils.map(({ name, path }) => `import ${name} from "${path}"`).join("\n"),
                    "",
                    // Named exports too, so `#rform/utils` is the single public
                    // entry — `defineRule` and friends are imported, not global.
                    // Extensionless: a `.ts` specifier needs
                    // `allowImportingTsExtensions`, which a consumer app may not set.
                    utils.map(({ path }) => `export * from ${specifier(path)}`).join("\n"),
                    "",
                    "export {",
                    `   ${utils.map(({ name }) => name).join(",\n   ")}`,
                    "}",
                    "",
                    "export default {",
                    `   ${utils.map(({ name }) => name).join(",\n   ")}`,
                    "}"
                ].join("\n")
        });

        const alias = {
            name: `#${name}`,
            path: `${nuxt.options.buildDir}/${name}`
        };

        nuxt.options.alias ||= {};
        nuxt.options.alias[`${alias.name}`] = alias.path;
        nuxt.options.alias[`${alias.name}/*`] = `${alias.path}/*`;

        addComponentsDir({
            prefix: "R",
            preload: true,
            prefetch: true,
            path: componentsPath
        });

        addImports({
            name: "default",
            as: "useRForm",
            from: resolve("runtime/composables/useRForm")
        });

        addVitePlugin(vitePlugin);
    }
});