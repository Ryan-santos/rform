import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const COMPONENTS = path.join("src", "runtime", "components");
const MODULE = path.join("src", "module.ts");

/**
 * Todo ícone do módulo passa pelo `icon()`, que prefixa o namespace `rform:` com que
 * os aliases são registrados. Estes testes existem porque as duas formas de quebrar
 * isso são caladas — alias sem uso não avisa nada, e nome sem alias renderiza vazio
 * com um `console.warn` que ninguém lê. Ver "Os ícones vivem num namespace" no
 * `.claude/CLAUDE.md`.
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

/** Os aliases que o `prefixIcons` do módulo registra no `@nuxt/icon`. */
const declared = async () => {
    const source = await readFile(MODULE, "utf8");
    const block = /aliases: prefixIcons\(\{([\s\S]*?)\}\)/.exec(source)?.[1] ?? "";

    return new Set([...block.matchAll(/^\s*"?([a-z][a-z-]*)"?:/gm)].map((match) => match[1]!));
};

describe("namespace dos ícones", () => {
    it("declara todo nome que os componentes pedem, e usa todo o que declara", async () => {
        const used = new Set<string>();

        for (const { text } of await sources()) {
            // Pega tanto `icon('plus')` quanto os dois ramos de um
            // `icon(broken ? 'alert' : 'file')`.
            for (const call of text.matchAll(/\bicon\(([^)]*)\)/g)) {
                for (const literal of call[1]!.matchAll(/['"]([a-z][a-z-]*)['"]/g)) {
                    used.add(literal[1]!);
                }
            }
        }

        const aliases = await declared();

        expect(aliases.size).toBeGreaterThan(0);
        expect(used.size).toBeGreaterThan(0);

        // Oferecidos ao app, não usados pelo módulo — um campo do usuário chama
        // `icon("image")` e recebe o mesmo conjunto. Fora desta lista, alias sem uso é
        // bug: ninguém sabe que ele não faz nada.
        const orphans = new Set<string>(["image"]);

        // Os dois sentidos: nada pedido sem declarar (renderiza vazio, calado), nada
        // declarado sem uso.
        expect([...used].filter((name) => !aliases.has(name))).toEqual([]);
        expect([...aliases].filter((name) => !used.has(name) && !orphans.has(name))).toEqual([]);

        // E a lista não pode envelhecer: um componente que passe a pedir o alias tira
        // ele daqui.
        expect([...orphans].filter((name) => used.has(name) || !aliases.has(name))).toEqual([]);
    });

    it("não deixa nome de ícone sem prefixo no template", async () => {
        const offenders: string[] = [];

        for (const { file, text } of await sources()) {
            // Um `name="loading"` estático só resolve enquanto existir um alias `loading`
            // no espaço global — que é justamente o que o namespace tirou. Nome com `:`
            // é iconify cru e passa; o resto tem de vir do `icon()`.
            for (const match of text.matchAll(/<Icon\b[^>]*?\sname="([^"]*)"/g)) {
                if (!match[1]!.includes(":")) {
                    offenders.push(`${file}: name="${match[1]}"`);
                }
            }
        }

        expect(offenders).toEqual([]);
    });

    it("prefixa com o mesmo nome curto que o alias do módulo", async () => {
        // O `icon()` do runtime e o `prefixIcons` do build têm de concordar no prefixo,
        // e nada os liga: o runtime não pode importar da raiz de `src/`, que não chega
        // ao `dist`.
        const helper = await readFile(path.join("src", "runtime", "utils", "icon.ts"), "utf8");
        const prefix = /`([a-z]+):\$\{name\}`/.exec(helper)?.[1];

        const source = await readFile(MODULE, "utf8");
        const short = /^const name = "([a-z]+)";$/m.exec(source)?.[1];

        expect(prefix).toBeTruthy();
        expect(prefix).toBe(short);
    });
});