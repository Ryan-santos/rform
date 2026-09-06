/**
 * Gera `app/generated/api.json` — a lista de props, slots e eventos de cada
 * componente do módulo, lida do fonte pelo `vue-component-meta`.
 *
 * O checker roda contra o **tsconfig do docs**, e não contra o da raiz, porque é
 * aqui que `#rform/*` resolve com os tipos gerados deste app. Depende, portanto,
 * de `nuxi prepare docs` ter rodado — mesma pré-condição do `test:types`.
 */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createChecker } from "vue-component-meta";

const here = dirname(fileURLToPath(import.meta.url));

const docs = resolve(here, "..");
const root = resolve(docs, "..");

const tsconfig = join(docs, ".nuxt", "tsconfig.app.json");

const components = join(root, "src", "runtime", "components");

export type PropMeta = {
    name: string;
    type: string;
    required: boolean;
    default?: string;
};

export type ComponentMeta = {
    /** Nome do arquivo sem extensão — a tag é `R<name>` ou `RUtils<name>`. */
    name: string;
    kind: "field" | "util" | "root";
    props: PropMeta[];
    slots: string[];
    events: string[];
};

/**
 * Os props do módulo saem de interseção (`Element<…> & Utils[…] & TextProp<…>`),
 * então o checker devolve a lista achatada e completa — mas sem descrição, que
 * não existe em lugar nenhum para ele ler. Quem explica é a prosa ao lado.
 */
const clean = (type: string) => type.replace(/\s+/g, " ").trim();

/** `onUpdate:modelValue` — o emit que o checker devolve espelhado como prop. */
const EVENT_PROP = /^on[A-Z]/;

/** O `default` vem como expressão fonte; string vazia e `undefined` não valem linha. */
const defaultOf = (value: unknown) => {
    const text = typeof value === "string" ? value.trim() : "";

    return text && text !== "undefined" ? text : undefined;
};

function meta(checker: ReturnType<typeof createChecker>, file: string, kind: ComponentMeta["kind"]) {
    const info = checker.getComponentMeta(file);

    // O checker lista todo emit também como prop `onXxx`; aqui o evento é o
    // `events`, e a lista de props fica só com o que se escreve como atributo.
    const props: PropMeta[] = info.props
        .filter((prop) => !prop.global && !EVENT_PROP.test(prop.name))
        .map((prop) => ({
            name: prop.name,
            type: clean(prop.type),
            required: prop.required,
            default: defaultOf(prop.default)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const emits = info.props
        .filter((prop) => !prop.global && EVENT_PROP.test(prop.name))
        .map((prop) => prop.name.slice(2, 3).toLowerCase() + prop.name.slice(3));

    return {
        name: file.slice(file.lastIndexOf("/") + 1, -".vue".length),
        kind,
        props,
        slots: info.slots.map((slot) => slot.name).sort(),
        events: [...new Set([...info.events.map((event) => event.name), ...emits])].sort()
    } satisfies ComponentMeta;
}

const vueFiles = (dir: string) =>
    readdirSync(dir)
        .filter((name) => name.endsWith(".vue"))
        .map((name) => join(dir, name).replaceAll("\\", "/"))
        .sort();

const checker = createChecker(tsconfig, {
    forceUseTs: true,
    printer: { newLine: 1 }
});

const all: ComponentMeta[] = [];

for (const file of vueFiles(join(components, "fields"))) {
    all.push(meta(checker, file, "field"));
}

for (const file of vueFiles(join(components, "utils"))) {
    all.push(meta(checker, file, "util"));
}

for (const name of ["Form.vue", "Dynamic.vue"]) {
    all.push(meta(checker, join(components, name).replaceAll("\\", "/"), "root"));
}

const out = join(docs, "app", "generated", "api.json");

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(all, null, 4)}\n`, "utf8");

console.log(`[rform-docs] api.json — ${all.length} componentes, ${all.reduce((n, c) => n + c.props.length, 0)} props`);