import type { InjectionKey, Ref } from "vue";

/**
 * As camadas de `ui` são lidas do próprio módulo, não redigitadas aqui: o glob
 * pega o mesmo arquivo que o `addComponentsDir` registra, então o que a página
 * mostra é literalmente o default que o componente declara.
 */
const modules = import.meta.glob<{ defaults?: Record<string, unknown> }>(
    "../../../../src/runtime/components/**/*.vue",
    { eager: true }
);

/** O mesmo glob em `?raw`, para ler o template e saber onde cada Util entra. */
const sources = import.meta.glob<string>("../../../../src/runtime/components/**/*.vue", {
    eager: true,
    query: "?raw",
    import: "default"
});

/**
 * A busca é pelo sufixo `components/<caminho>` porque `Calendar.vue` existe nas
 * duas pastas — sem o `components/` na frente, campo e util colidiriam.
 */
function entry<T>(map: Record<string, T>, path: string): T | undefined {
    const key = Object.keys(map).find((name) => name.endsWith(`/components/${path}`));

    return key ? map[key] : undefined;
}

/**
 * Campo mora em `components/fields/`; `Form` e `Dynamic`, na raiz de
 * `components/` — nenhum dos dois é campo, mas os dois têm `ui` para mostrar.
 */
const field = <T>(map: Record<string, T>, name: string) =>
    entry(map, `fields/${name}.vue`) ?? entry(map, `${name}.vue`);

export const fieldUi = (name: string) => field(modules, name)?.defaults?.ui;

export const utilUi = (name: string) => entry(modules, `utils/${name}.vue`)?.defaults?.ui;

/** Os `RUtilsX` que aparecem no template do campo, na ordem em que aparecem. */
export function fieldUtils(name: string): string[] {
    const source = field(sources, name) ?? "";

    return [
        ...new Set([...source.matchAll(/<RUtils([A-Z]\w*)/g)].map((match) => match[1] as string))
    ];
}

/** Classe declarada em template literal chega com a indentação do arquivo. */
const classes = (value: string) => value.replace(/\s+/g, " ").trim();

export type UiNode = {
    key: string;
    path: string;
    value?: string;
    children?: UiNode[];
    /** `util` é um `RUtilsX` montado dentro da camada, não uma chave de `ui`. */
    kind?: "ui" | "util";
    /** Subárvore grande demais para ficar aberta (o ui do Calendar, por exemplo). */
    collapsed?: boolean;
};

function nodes(value: unknown, prefix: string): UiNode[] {
    if (!value || typeof value !== "object") {
        return [];
    }

    return Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        const path = prefix ? `${prefix}.${key}` : key;

        if (item && typeof item === "object") {
            return { key, path, children: nodes(item, path) };
        }

        return {
            key,
            path,
            value: typeof item === "string" ? classes(item) : String(item)
        };
    });
}

/**
 * `ui` às vezes é uma string só (Form, RUtilsDescription) — nesse caso a árvore
 * é uma folha única, para o diagrama não sair vazio.
 */
export function uiNodes(ui: unknown, prefix = ""): UiNode[] {
    if (typeof ui === "string") {
        return [
            {
                key: prefix.split(".").pop() || "ui",
                path: prefix || "ui",
                value: classes(ui)
            }
        ];
    }

    return nodes(ui, prefix);
}

const count = (list: UiNode[]): number =>
    list.reduce((total, node) => total + 1 + count(node.children ?? []), 0);

/* ── posição dos Utils dentro do template ─────────────────────────────────── */

type Placement = { util: string; children: Placement[] };

const VOID = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);

const UI_BINDING = /props\.ui\?\.([\w?.]+)/;

const TAG_NAME = /^<\/?([A-Za-z][\w.-]*)/;

/** `props.ui?.group?.wrapper?.container` → `group.wrapper.container`. */
const bindingPath = (chunk: string) => UI_BINDING.exec(chunk)?.[1]?.replaceAll("?", "");

/**
 * Anda até o `>` que fecha a tag, pulando os que moram dentro de valor de
 * atributo — um `:class` com ternário carrega mais de um.
 */
function endOfTag(source: string, from: number): number {
    let quote: string | null = null;

    for (let index = from; index < source.length; index++) {
        const char = source[index];

        if (quote) {
            if (char === quote) {
                quote = null;
            }

            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }

        if (char === ">") {
            return index;
        }
    }

    return -1;
}

/** Só o primeiro bloco `<template>` do SFC — o resto é script e estilo. */
function templateOf(source: string): string {
    const start = source.indexOf("<template>");
    const end = source.lastIndexOf("</template>");

    return start === -1 || end <= start ? "" : source.slice(start + 10, end);
}

/**
 * Percorre o template mantendo a pilha de elementos e, para cada `RUtilsX`,
 * anota o caminho de `ui` do elemento que o envolve. É isso que permite mostrar
 * o Placeholder dentro de `group.field.container` em vez de numa lista solta.
 */
function placements(component: string): Map<string, Placement[]> {
    const template = templateOf(field(sources, component) ?? "");
    const map = new Map<string, Placement[]>();

    const at = (path: string) => {
        const list = map.get(path) ?? [];

        map.set(path, list);

        return list;
    };

    type Frame = { path: string; list: Placement[] };

    const stack: Frame[] = [];

    let frame: Frame = { path: "", list: at("") };
    let index = 0;

    while (index < template.length) {
        const open = template.indexOf("<", index);

        if (open === -1) {
            break;
        }

        if (!/[A-Za-z/]/.test(template[open + 1] ?? "")) {
            index = open + 1;
            continue;
        }

        const end = endOfTag(template, open);

        if (end === -1) {
            break;
        }

        const chunk = template.slice(open, end + 1);
        const name = TAG_NAME.exec(chunk)?.[1];

        index = end + 1;

        if (!name) {
            continue;
        }

        if (chunk.startsWith("</")) {
            frame = stack.pop() ?? frame;
            continue;
        }

        const selfClosing = chunk.endsWith("/>");

        if (name.startsWith("RUtils")) {
            const placement: Placement = { util: name.slice(6), children: [] };

            frame.list.push(placement);

            if (!selfClosing) {
                stack.push(frame);
                frame = { path: frame.path, list: placement.children };
            }

            continue;
        }

        if (!selfClosing && !VOID.has(name.toLowerCase())) {
            const path = bindingPath(chunk);

            stack.push(frame);
            frame = path ? { path, list: at(path) } : { ...frame };
        }
    }

    return map;
}

function utilNodes(list: Placement[], prefix: string): UiNode[] {
    return list.map((placement) => {
        const own = uiNodes(utilUi(placement.util), `${prefix}.@${placement.util}.ui`);
        const path = `${prefix}.@${placement.util}`;

        return {
            key: `RUtils${placement.util}`,
            path,
            kind: "util" as const,
            collapsed: count(own) > 10,
            children: [...own, ...utilNodes(placement.children, path)]
        };
    });
}

const getIn = (value: unknown, key: string) =>
    value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;

/**
 * A árvore do campo com os Utils no lugar onde o template os monta. As chaves de
 * `ui` continuam na forma do objeto (é o que se escreve no defaults); os Utils
 * entram como camada dentro da chave que os envolve no DOM.
 */
export function fieldTree(component: string): UiNode[] {
    const map = placements(component);

    const build = (value: unknown, prefix: string, key: string): UiNode[] => {
        const list = uiNodes(value, prefix);

        return list.map((node) => {
            const inner = key ? `${key}.${node.key}` : node.key;
            const own = node.children ? build(getIn(value, node.key), node.path, inner) : [];

            const mounted = utilNodes(map.get(inner) ?? [], node.path);

            return {
                ...node,
                kind: "ui" as const,
                children: [...own, ...mounted].length ? [...own, ...mounted] : undefined
            };
        });
    };

    const root = build(fieldUi(component), "ui", "");
    const loose = utilNodes(map.get("") ?? [], "ui");

    return [...root, ...loose];
}

/* ── snippet de defaults ──────────────────────────────────────────────────── */

const IDENTIFIER = /^(?:[A-Za-z_$][\w$]*|\d+)$/;

function serialize(value: unknown, indent: number): string {
    const pad = " ".repeat(indent);

    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>);

        if (!entries.length) {
            return "{}";
        }

        const body = entries
            .map(([key, item]) => {
                const name = IDENTIFIER.test(key) ? key : `"${key}"`;

                return `${pad}    ${name}: ${serialize(item, indent + 4)}`;
            })
            .join(",\n");

        return `{\n${body}\n${pad}}`;
    }

    if (typeof value === "string") {
        return `"${classes(value)}"`;
    }

    return String(value);
}

/**
 * O mesmo objeto do diagrama, já no formato de `app/rform/defaults.ts` — é o
 * ponto de partida para sobrescrever qualquer camada.
 */
export function uiSnippet(name: string): string {
    const utils = fieldUtils(name).reduce<Record<string, unknown>>((all, util) => {
        const ui = utilUi(util);

        return ui ? { ...all, [util]: { ui } } : all;
    }, {});

    const body: Record<string, unknown> = { [name]: { ui: fieldUi(name) } };

    if (Object.keys(utils).length) {
        body.Utils = utils;
    }

    return [
        'import { defineFieldDefaults } from "#rform/utils";',
        "",
        `export default defineFieldDefaults(${serialize(body, 0)});`
    ].join("\n");
}

export type UiFocus = {
    path: Ref<string | null>;
    toggle: (path: string) => void;
    state: (path: string) => "active" | "related" | "dimmed" | "idle";
};

export const uiFocusKey = Symbol("ui-focus") as InjectionKey<UiFocus>;