import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { demoSourceOf } from "../../docs/app/utils/demoSource";
import { buildMcp, pagePath, type McpData } from "../../docs/modules/mcp/data";

const root = fileURLToPath(new URL("../..", import.meta.url));

const content = join(root, "docs/content/en");

const demos = join(root, "docs/app/demos");

const presets = join(root, "src/runtime/presets");

const components = join(root, "src/runtime/components");

/**
 * O mesmo dado que o módulo `modules/mcp` escreve em `.nuxt/docs/mcp.json`.
 *
 * Chamar a função, e não ler o arquivo: o artefato nasce em todo build, então não
 * há como ele envelhecer — o que sobra para testar é a derivação.
 */
const data: McpData = buildMcp();

/** Todo arquivo sob `dir` que casa com `test`, em caminho relativo com `/`. */
async function walk(dir: string, test: (name: string) => boolean): Promise<string[]> {
    const inner = async (at: string, prefix: string): Promise<string[]> => {
        const entries = await readdir(join(dir, at), { withFileTypes: true });

        const found = await Promise.all(
            entries.map(async (entry) => {
                const path = prefix ? `${prefix}/${entry.name}` : entry.name;

                return entry.isDirectory()
                    ? inner(join(at, entry.name), path)
                    : test(entry.name)
                      ? [path]
                      : [];
            })
        );

        return found.flat();
    };

    return (await inner("", "")).sort();
}

describe("pagePath", () => {
    // O ponto mais fácil de apodrecer: a derivação espelha o `@nuxt/content`, que
    // tira o prefixo `NN.` de cada segmento e trata `index` como a raiz.
    it.each([
        ["0.index.md", "/"],
        ["3.fields/01.text.md", "/fields/text"],
        ["1.getting-started/4.como-funciona.md", "/getting-started/como-funciona"],
        ["4.concepts/3.presets.md", "/concepts/presets"],
        ["5.support/1.faq.md", "/support/faq"]
    ])("%s → %s", (file, path) => {
        expect(pagePath(file)).toBe(path);
    });

    it("não inventa segmento vazio num `index` de subdiretório", () => {
        expect(pagePath("2.form/index.md")).toBe("/form");
    });
});

describe("páginas", () => {
    it("todo `.md` de `content/en` tem entrada, e nada além", async () => {
        const files = await walk(content, (name) => name.endsWith(".md"));

        expect(data.pages.map((page) => page.path).sort()).toEqual(files.map(pagePath).sort());
    });

    it("nenhum caminho se repete", () => {
        const paths = data.pages.map((page) => page.path);

        expect(paths).toEqual([...new Set(paths)]);
    });

    it("toda página tem título e o markdown que o arquivo guarda", async () => {
        const home = data.pages.find((page) => page.path === "/");
        const text = data.pages.find((page) => page.path === "/fields/text");

        expect(data.pages.every((page) => page.title && page.markdown)).toBe(true);
        expect(home?.title).toBe("rform");
        expect(text?.tag).toBe("RText");
        expect(text?.markdown).toBe(
            (await readFile(join(content, "3.fields/01.text.md"), "utf8"))
                .replace(/\r\n/g, "\n")
                .trimEnd()
        );
    });
});

describe("demos", () => {
    it("todo `.vue` de `app/demos` está no JSON", async () => {
        const files = await walk(demos, (name) => name.endsWith(".vue"));

        expect(data.demos.map((demo) => demo.name).sort()).toEqual(
            files.map((file) => file.slice(0, -".vue".length)).sort()
        );
    });

    // O que o MCP entrega tem de ser byte a byte o que o site mostra — é a razão
    // de `demoSourceOf` ter saído do `demos.ts`, que o Node não consegue importar.
    it("o `source` é o mesmo recorte que o `<DemoCode>` mostra", async () => {
        const files = await walk(demos, (name) => name.endsWith(".vue"));

        const expected = await Promise.all(
            files.map(async (file) => ({
                name: file.slice(0, -".vue".length),
                source: demoSourceOf(await readFile(join(demos, file), "utf8"))
            }))
        );

        expect(data.demos).toEqual(expected);
    });
});

describe("presets", () => {
    it("todo preset embutido aparece, com o nome em camelCase do `module.ts`", async () => {
        for (const kind of ["rule", "mask"] as const) {
            const files = await walk(join(presets, `${kind}s`), (name) => name.endsWith(".ts"));

            const names = data.presets
                .filter((preset) => preset.kind === kind)
                .map((preset) => preset.name)
                .sort();

            expect(names).toHaveLength(files.length);
            expect(names).toEqual([...new Set(names)]);
        }

        const rules = data.presets.filter((preset) => preset.kind === "rule");
        const masks = data.presets.filter((preset) => preset.kind === "mask");

        expect(rules.map((preset) => preset.name)).toContain("brCpf");
        expect(rules.map((preset) => preset.name)).toContain("required");
        expect(masks.map((preset) => preset.name)).toContain("brCpfCnpj");
    });

    it("o `available` sai do fonte, e só onde ele existe", () => {
        const by = (name: string, kind: string) =>
            data.presets.find((preset) => preset.name === name && preset.kind === kind);

        expect(by("brCpf", "rule")?.available).toEqual(["text"]);
        expect(by("required", "rule")?.available).toBeUndefined();
        expect(by("brCpf", "mask")?.source).toContain('mask: "###.###.###-##"');
    });
});

describe("api do componente", () => {
    // A tag sai do layout de `components/`, do mesmo jeito nos dois lados: o
    // `modules/api` enumera os diretórios e o `mcpData` deriva a tag do `kind`.
    // Aqui a fonte é o disco, então o teste não depende do artefato gerado.
    it("todo componente é alcançável por uma tag, e nenhuma colide", async () => {
        const named = async (dir: string, prefix: string) =>
            (await walk(join(components, dir), (name) => name.endsWith(".vue"))).map(
                (file) => `${prefix}${file.slice(0, -".vue".length)}`
            );

        const tags = [
            ...(await named("fields", "R")),
            ...(await named("utils", "RUtils")),
            "RForm",
            "RDynamic"
        ];

        expect(tags).toEqual([...new Set(tags)]);
        expect(tags).toContain("RText");
        // `Calendar` é campo **e** util; são as duas tags que os separam.
        expect(tags).toContain("RCalendar");
        expect(tags).toContain("RUtilsCalendar");
    });
});