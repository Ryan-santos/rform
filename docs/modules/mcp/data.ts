/**
 * A matéria-prima das ferramentas MCP: as páginas de `content/en`, o fonte de cada
 * demo e o de cada preset embutido. Puro — quem escreve o JSON é o `index.ts` ao
 * lado, e é isso que deixa `test/unit/mcp.test.ts` exercitar tudo sem app nenhum.
 *
 * Artefato de build, e não query ao `@nuxt/content`, de propósito: demo (`.vue`),
 * preset (`.ts`) e a saída do `vue-component-meta` não cabem em collection, então
 * metade das ferramentas precisaria de um de qualquer jeito — ver o CLAUDE.md.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { collectPresets } from "../../../src/presets.ts";
import { demoSourceOf } from "../../app/utils/demoSource.ts";

const here = dirname(fileURLToPath(import.meta.url));

const docs = resolve(here, "..", "..");
const root = resolve(docs, "..");

/** Só `en`: o MCP fala com agente, e a decisão foi um idioma só. */
const content = join(docs, "content", "en");

const demosDir = join(docs, "app", "demos");

const presetsDir = join(root, "src", "runtime", "presets");

export type McpPage = {
    /** O caminho da página no site, sem prefixo de idioma — `/fields/text`. */
    path: string;
    title: string;
    description?: string;
    /** A tag que a página documenta, quando há uma — `RText`. */
    tag?: string;
    /** Os títulos de nível 1 a 3, crus: dão ao agente a noção do que há dentro. */
    headings: string[];
    markdown: string;
};

export type McpDemo = {
    /** `"Text/basico"` — o mesmo `src` que o `::demo{src}` cita. */
    name: string;
    source: string;
};

export type McpPreset = {
    name: string;
    kind: "rule" | "mask";
    available?: string[];
    source: string;
};

export type McpData = {
    pages: McpPage[];
    demos: McpDemo[];
    presets: McpPreset[];
};

/** Todo arquivo sob `dir` que casa com `test`, em caminho relativo com `/`. */
const walk = (dir: string, test: (name: string) => boolean, prefix = ""): string[] =>
    readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) => {
            const path = prefix ? `${prefix}/${entry.name}` : entry.name;

            return entry.isDirectory()
                ? walk(join(dir, entry.name), test, path)
                : test(entry.name)
                  ? [path]
                  : [];
        })
        .sort();

/**
 * Espelha a rota que o `@nuxt/content` deriva: cai o prefixo `NN.` de cada
 * segmento, e `index` vira a raiz.
 *
 * @example pagePath("3.fields/01.text.md") // → "/fields/text"
 * @example pagePath("0.index.md") // → "/"
 */
export const pagePath = (relativePath: string): string => {
    const segments = relativePath
        .replace(/\.md$/, "")
        .split("/")
        .map((segment) => segment.replace(/^\d+\./, ""));

    if (segments.at(-1) === "index") {
        segments.pop();
    }

    return `/${segments.join("/")}`.replace(/\/{2,}/g, "/");
};

/** O frontmatter de uma página, achatado em strings — só as chaves que o schema tem. */
const frontmatter = (source: string) => {
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);

    const fields: Record<string, string> = {};

    for (const line of match?.[1]?.split(/\r?\n/) ?? []) {
        const entry = /^(\w+):\s*(.*)$/.exec(line);

        if (entry) {
            fields[entry[1] as string] = (entry[2] as string)
                .trim()
                .replace(/^["'](.*)["']$/, "$1");
        }
    }

    return { fields, body: match ? source.slice(match[0].length).trimStart() : source };
};

/** As páginas de `content/en`, na ordem dos prefixos numéricos — a da barra lateral. */
export const readPages = (): McpPage[] =>
    walk(content, (name) => name.endsWith(".md")).map((file) => {
        const raw = readFileSync(join(content, file), "utf8").replace(/\r\n/g, "\n");

        const { fields, body } = frontmatter(raw);

        const headings = [...body.matchAll(/^#{1,3} +(.+)$/gm)].map((match) =>
            (match[1] as string).trim()
        );

        return {
            path: pagePath(file),
            title: fields.title ?? headings[0] ?? file,
            ...(fields.description ? { description: fields.description } : {}),
            ...(fields.tag ? { tag: fields.tag } : {}),
            headings,
            markdown: raw.trimEnd()
        };
    });

/** O fonte de cada demo, pelo mesmo recorte que o `<DemoCode>` mostra. */
export const readDemos = (): McpDemo[] =>
    walk(demosDir, (name) => name.endsWith(".vue")).map((file) => ({
        name: file.slice(0, -".vue".length),
        source: demoSourceOf(readFileSync(join(demosDir, file), "utf8"))
    }));

/**
 * O `available` sai de um regex estreito — o `oxfmt` do repo mantém a lista numa
 * linha só. O `source` cru vai junto, então o agente tem a verdade completa mesmo
 * se o regex não casar.
 */
const availableOf = (source: string) => {
    const match = /available:\s*\[([^\]]*)\]/.exec(source);

    const list = (match?.[1] ?? "")
        .split(",")
        .map((item) => item.trim().replace(/^["'](.*)["']$/, "$1"))
        .filter(Boolean);

    return list.length > 0 ? list : undefined;
};

/** Os presets embutidos de um tipo, com o nome que o `module.ts` deriva. */
export const readPresets = (kind: "rule" | "mask"): McpPreset[] => {
    const dir = join(presetsDir, `${kind}s`);

    return collectPresets(walk(dir, (name) => name.endsWith(".ts"))).map(({ name, file }) => {
        const source = readFileSync(join(dir, file), "utf8").replace(/\r\n/g, "\n").trimEnd();

        const available = availableOf(source);

        return { name, kind, ...(available ? { available } : {}), source };
    });
};

/** Tudo que o `mcp.json` carrega. */
export const buildMcp = (): McpData => ({
    pages: readPages(),
    demos: readDemos(),
    presets: [...readPresets("rule"), ...readPresets("mask")]
});