import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const COMPONENTS = path.join("src", "runtime", "components");
const STYLESHEET = path.join("src", "runtime", "style.css");
/** Onde os templates do módulo saem — o mesmo `.nuxt/rform` que o vitest.config aliasa. */
const FIXTURE = path.join("test", "fixtures", "basic", ".nuxt", "rform");

/**
 * Toda cor e todo radius do módulo vêm de `--rf-*` (ver `src/runtime/style.css`), e
 * não de um token `@theme` que só o playground define. Estes testes existem porque as
 * duas formas de quebrar isso são silenciosas:
 *
 * - `text-danger` volta a compilar no playground e some em qualquer outro app;
 * - `bg-(--rf-color-primry)` (typo) compila, passa na lint, e renderiza
 *   `var(--undefined)` — transparente, sem erro, em todo ambiente inclusive nos testes.
 *
 * A lint não cobre nem o primeiro: o matcher `objectValues` do `better-tailwindcss`
 * em `oxlint.config.ts` recebe um shorthand cujo valor é um `Identifier` nos cinco
 * utils que fazem `const ui = {…}` + `defineDefaults({ ui })`, então não tem object
 * literal para percorrer. É por ali que o drift entrou.
 */

const sources = async () => {
    const roots = [COMPONENTS, path.join(COMPONENTS, "fields"), path.join(COMPONENTS, "utils")];
    const found: { file: string; text: string }[] = [];

    for (const root of roots) {
        for (const entry of await readdir(root, { withFileTypes: true })) {
            if (entry.isFile() && entry.name.endsWith(".vue")) {
                const file = path.join(root, entry.name);

                found.push({ file, text: await readFile(file, "utf8") });
            }
        }
    }

    return found;
};

/**
 * Tokenizar o arquivo inteiro, não linha a linha: as classes quebram linha dentro dos
 * template strings, então um regex por linha erra nas bordas do wrap.
 */
const classTokens = (text: string) =>
    text
        .split(/\s+/)
        /**
         * Tirar a pontuação que delimita a string, senão a última classe de cada literal
         * chega como `text-white",` e escapa de todo padrão ancorado em `$`. Só nas
         * pontas: `(`/`)`/`[`/`]` fazem parte de `bg-(--rf-…)` e `has-[:focus]:`, e o `!`
         * de `bg-(--rf-color-primary)!` também precisa sobreviver.
         */
        .map((token) => token.replace(/^[`'"{[,;]+/, "").replace(/[`'"},;:]+$/, ""))
        .filter(Boolean);

/**
 * Tirar variante (`hover:`, `has-[:focus]:`), o `!` final e o `/NN` final antes de
 * casar. Normalizar primeiro é o que impede `-primary` de pegar o próprio
 * `bg-(--rf-color-primary)`.
 */
const core = (token: string) =>
    token
        .replace(/^(?:[a-z0-9-]+|[a-z-]+\[[^\]]*\]|(?:group|peer)-[a-z-]+):(?=\S)/g, "")
        .replace(/!+$/, "")
        .replace(/\/\d+$/, "");

const BANNED = [
    // Tokens `@theme` que só o playground define.
    /^(?:bg|text|border|divide|outline|ring|fill|stroke|from|via|to|decoration|accent|caret|placeholder|shadow)-(?:background|contrast|primary|secondary|success|warn|danger)(?:-\d{2,3})?$/,
    /**
     * Texto sobre fundo `primary`/`danger` é `--rf-color-*-fg`, para o par acompanhar
     * a cor herdada do app. `border-white` fica de fora de propósito: o anel dos
     * marcadores do color picker (`fields/Color.vue`) é branco por desenho, para
     * contrastar com uma cor arbitrária escolhida pelo usuário.
     */
    /^(?:text|bg)-(?:white|black)$/,
    // A escala de radius também é token; `full`/`none` são estruturais e ficam.
    /^rounded(?:-[trblxyse]{1,2})?-(?:xs|sm|md|lg|xl|2xl|3xl|4xl)$/
];

describe("theme tokens", () => {
    it("keeps every colour and radius on a --rf-* variable", async () => {
        const offenders: string[] = [];

        for (const { file, text } of await sources()) {
            for (const token of classTokens(text)) {
                const bare = core(token);

                if (BANNED.some((pattern) => pattern.test(bare))) {
                    offenders.push(`${file}: ${token}`);
                }
            }
        }

        expect(offenders).toEqual([]);
    });

    it("declares every --rf-* the components read, and reads every one it declares", async () => {
        const used = new Set<string>();

        for (const { text } of await sources()) {
            // `match[0]` é `string`; um grupo capturado seria `string | undefined`.
            for (const match of text.matchAll(/\(--rf-[a-z0-9-]+\)/g)) {
                used.add(match[0].slice(1, -1));
            }
        }

        const stylesheet = await readFile(STYLESHEET, "utf8");
        const declared = new Set(
            [...stylesheet.matchAll(/--rf-[a-z0-9-]+(?=\s*:)/g)].map((match) => match[0])
        );

        /**
         * Degraus que existem para o app, não para o módulo: a escala
         * `-100/-200/-300` é oferecida inteira, mas nenhum `ui` embutido lê o `-200`
         * hoje. Fora desta lista, token declarado sem uso é bug — é o que sobra
         * quando um `ui` para de usar uma cor e ninguém tira a variável.
         */
        const orphans = new Set(["--rf-color-background-200"]);

        // Os dois sentidos: nada usado sem declarar (renderiza transparente, calado),
        // nada declarado sem uso (token morto que ninguém sabe que não faz nada).
        expect([...used].filter((name) => !declared.has(name))).toEqual([]);
        expect([...declared].filter((name) => !used.has(name) && !orphans.has(name))).toEqual([]);

        // E a lista não pode envelhecer: um `ui` que passe a ler o `-200` tira ele daqui.
        expect([...orphans].filter((name) => used.has(name) || !declared.has(name))).toEqual([]);
    });

    it("generates a #rform/tailwindcss carrying both the @source and the tokens", async () => {
        /**
         * A única linha que um app escreve no CSS dele, e ela traz as duas coisas. Se
         * o `@source` faltar ou apontar errado a falha é a pior possível: o app
         * compila, nada avisa, e todo campo renderiza sem fundo, sem raio e sem cor —
         * o Tailwind não varre `node_modules`, então nenhuma classe do módulo é emitida.
         *
         * O caminho sai absoluto de propósito. Um `@source` relativo dentro de um
         * arquivo publicado só funcionaria com o pacote instalado em `node_modules`, e
         * o playground carrega o módulo por caminho relativo — não tem
         * `node_modules/rform`.
         */
        // Sem comentários: o do template cita `@import "tailwindcss"` e entraria no match.
        const source = (await readFile(path.join(FIXTURE, "tailwind.css"), "utf8")).replace(
            /\/\*[\s\S]*?\*\//g,
            ""
        );

        const sources = [...source.matchAll(/@source\s+"([^"]+)"/g)];

        expect(sources).toHaveLength(1);

        const target = sources[0]?.[1] ?? "";

        expect(path.isAbsolute(target)).toBe(true);
        // Sem `\` — em CSS a barra invertida do Windows seria escape.
        expect(target).not.toContain("\\");

        // O diretório tem de existir e ser mesmo o dos componentes do módulo.
        const listing = await readdir(target);

        expect(listing).toContain("fields");
        expect(listing).toContain("utils");
        expect(listing).toContain("Form.vue");

        // E os tokens, que desde a mudança vêm por aqui e não por `nuxt.options.css`.
        const imports = [...source.matchAll(/@import\s+"([^"]+)"/g)];

        expect(imports).toHaveLength(1);

        const tokens = imports[0]?.[1] ?? "";

        expect(tokens).toMatch(/\/style\.css$/);
        expect(tokens).not.toContain("\\");
        expect(await readFile(tokens, "utf8")).toContain("--rf-color-primary");
    });

    it("declares every token inside @layer rform", async () => {
        /**
         * É esta a invariante que faz o override funcionar, e a única que funciona
         * independente de onde o app põe o `@import "#rform/tailwindcss"`. Estando os
         * tokens numa layer *nomeada*, o app tem dois alvos imunes à ordem: repetir
         * `@layer rform { :root { … } }` (mesma layer, e o bloco do app vem depois,
         * então ganha por ordem de declaração) ou declarar fora de layer.
         *
         * Um `:root` solto **aqui** inverteria tudo, nas duas ordens: declaração de
         * autor fora de layer ganha de *toda* layer de autor, antes de especificidade
         * entrar na conta, e o override do app pararia de pegar sem nenhum aviso.
         */
        const stylesheet = await readFile(STYLESHEET, "utf8");
        const stripped = stylesheet.replace(/\/\*[\s\S]*?\*\//g, "");

        // Remove os blocos `@layer rform { … }` e não deve sobrar token nenhum fora.
        let depth = 0;
        let inLayer = false;
        let outside = "";

        for (const part of stripped.split(/(\{|\})/)) {
            if (part === "{") {
                depth++;
            } else if (part === "}") {
                depth--;
                if (depth === 0) {
                    inLayer = false;
                }
            } else {
                if (depth === 0 && /@layer\s+rform\s*$/.test(part)) {
                    inLayer = true;
                }
                if (!inLayer) {
                    outside += part;
                }
            }
        }

        expect(outside).not.toContain("--rf-");

        // E a layer tem de ser declarada antes de qualquer bloco, para registrar cedo.
        expect(stripped.trimStart()).toMatch(/^@layer\s+rform\s*;/);
    });

    it("keeps the stylesheet from contributing Tailwind theme tokens", async () => {
        /**
         * O arquivo agora é `@import`ado do entry do Tailwind, então `@theme` e
         * `@apply` ali **seriam** processados — e é justamente o que não se quer: um
         * `@theme` do módulo despejaria variáveis e utilitários no namespace do design
         * system do app (`--color-foo` viraria `bg-foo` lá).
         */
        const stylesheet = await readFile(STYLESHEET, "utf8");
        const stripped = stylesheet.replace(/\/\*[\s\S]*?\*\//g, "");
        const atRules = [...stripped.matchAll(/@[a-z-]+/g)].map((match) => match[0].slice(1));

        expect(
            [...new Set(atRules)].filter((rule) => !["layer", "media", "supports"].includes(rule))
        ).toEqual([]);
    });
});