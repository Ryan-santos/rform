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
import { basename } from "node:path";

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

        addTypeTemplate({
            filename: `${name}/types/schema.d.ts`,
            write: true,
            getContents: () => {
                const fieldNames = fieldComponents.map(c => c.name);
                return [
                    `import type Components from "./components";`,
                    `import type { ZodType, infer as zInfer } from "zod";`,
                    ``,
                    `type Base<P> = Omit<P, "modelValue" | "onUpdate:modelValue" | "ui" | "name" | "error" | "loading" | "default" | "rule"> & {`,
                    `    rule?: ZodType;`,
                    `    default?: unknown;`,
                    `    label?: string;`,
                    `};`,
                    ``,
                    `export type SlotField = { slot: string; rule?: ZodType };`,
                    ``,
                    `export type Schema = Record<string, FieldConfig | SlotField>;`,
                    ``,
                    ...fieldNames.map((n) => {
                        const t = n.toLowerCase();
                        const extra = containerChildren[n] ? `; children: ${containerChildren[n]}` : "";
                        return `export type Field${n} = Base<Components["${n}"]> & { type: "${t}"${extra} };`;
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
                    `export type FieldType = FieldConfig["type"];`
                ].join("\n");
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